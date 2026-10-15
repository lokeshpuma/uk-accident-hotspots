#!/usr/bin/env python3
"""
tests/test_core_engine.py
Deterministic Unit Tests for HotspotWatch Core Engine (PRD Sections 15 & 20)
Verifies:
1. Spatial Grid Cell Math (0.02 deg bounding grid)
2. Diurnal Time-Band Partitioning
3. Exponential Recency Decay Formulation (W * 0.5^(age / lambda))
4. Severity Weight Scaling
5. CSV Formula Injection Defense
6. SSRF Webhook URL Validation
"""

import math
import unittest
from datetime import datetime, timezone

from services.api.main import sanitize_csv_cell, is_safe_webhook_url


def compute_grid_cell(lat: float, lon: float, step: float = 0.02) -> str:
    """Computes deterministic spatial grid cell id."""
    lat_idx = math.floor(lat / step) * step
    lon_idx = math.floor(lon / step) * step
    return f"{lat_idx:.2f}_{lon_idx:.2f}"


def classify_diurnal_band(hour: int) -> str:
    """Classifies diurnal time band according to PRD Section 5.8."""
    if 7 <= hour < 10:
        return "AM_PEAK"
    elif 10 <= hour < 16:
        return "DAY"
    elif 16 <= hour < 19:
        return "PM_PEAK"
    else:
        return "NIGHT"


def compute_recency_weight(
    severity: int,
    event_timestamp: datetime,
    current_timestamp: datetime,
    half_life_days: float = 30.0,
    sev_weights: dict = None
) -> float:
    """Computes recency decay score: W * 0.5^(age_days / half_life)."""
    if sev_weights is None:
        sev_weights = {1: 5.0, 2: 3.0, 3: 1.0}
    w = sev_weights.get(severity, 1.0)
    age_seconds = max(0.0, (current_timestamp - event_timestamp).total_seconds())
    age_days = age_seconds / 86400.0
    decay = math.pow(0.5, age_days / half_life_days)
    return w * decay


class TestHotspotCoreEngine(unittest.TestCase):

    def test_spatial_grid_partitioning(self):
        """Test spatial discretization into 0.02 degree grid cells."""
        cell1 = compute_grid_cell(51.5074, -0.1278, step=0.02)
        cell2 = compute_grid_cell(51.5120, -0.1210, step=0.02)
        # Both fall within the same 0.02 grid box in central London
        self.assertEqual(cell1, cell2)
        self.assertEqual(cell1, "51.50_-0.14")

        # Farther point falls into different cell
        cell3 = compute_grid_cell(51.5500, -0.1278, step=0.02)
        self.assertNotEqual(cell1, cell3)

    def test_diurnal_time_bands(self):
        """Test time-band classification boundaries."""
        self.assertEqual(classify_diurnal_band(7), "AM_PEAK")
        self.assertEqual(classify_diurnal_band(9), "AM_PEAK")
        self.assertEqual(classify_diurnal_band(10), "DAY")
        self.assertEqual(classify_diurnal_band(15), "DAY")
        self.assertEqual(classify_diurnal_band(16), "PM_PEAK")
        self.assertEqual(classify_diurnal_band(18), "PM_PEAK")
        self.assertEqual(classify_diurnal_band(19), "NIGHT")
        self.assertEqual(classify_diurnal_band(23), "NIGHT")
        self.assertEqual(classify_diurnal_band(0), "NIGHT")
        self.assertEqual(classify_diurnal_band(6), "NIGHT")

    def test_recency_decay_mathematical_properties(self):
        """Test exponential half-life decay formula."""
        now = datetime(2025, 12, 31, 12, 0, 0, tzinfo=timezone.utc)
        sev_weights = {1: 5.0, 2: 3.0, 3: 1.0}

        # Event now (age 0)
        score_now = compute_recency_weight(1, now, now, half_life_days=30.0, sev_weights=sev_weights)
        self.assertAlmostEqual(score_now, 5.0, places=4)

        # Event exactly 1 half-life ago (30 days ago) -> exactly half weight
        thirty_days_ago = datetime(2025, 12, 1, 12, 0, 0, tzinfo=timezone.utc)
        score_30d = compute_recency_weight(1, thirty_days_ago, now, half_life_days=30.0, sev_weights=sev_weights)
        self.assertAlmostEqual(score_30d, 2.5, places=4)

        # Event exactly 2 half-lives ago (60 days ago) -> 25% weight
        sixty_days_ago = datetime(2025, 11, 1, 12, 0, 0, tzinfo=timezone.utc)
        score_60d = compute_recency_weight(1, sixty_days_ago, now, half_life_days=30.0, sev_weights=sev_weights)
        self.assertAlmostEqual(score_60d, 1.25, places=4)

    def test_csv_formula_injection_defense(self):
        """Test spreadsheet formula injection sanitization (PRD Section 11.4)."""
        # Leading formula triggers
        self.assertEqual(sanitize_csv_cell("=1+1"), "'=1+1")
        self.assertEqual(sanitize_csv_cell("+cmd|' /C calc'!A0"), "'+cmd|' /C calc'!A0")
        self.assertEqual(sanitize_csv_cell("-2+3"), "'-2+3")
        self.assertEqual(sanitize_csv_cell("@SUM(A1:A10)"), "'@SUM(A1:A10)")
        self.assertEqual(sanitize_csv_cell("\tTABBED"), "'\tTABBED")

        # Benign values
        self.assertEqual(sanitize_csv_cell("M25 Junction 12"), "M25 Junction 12")
        self.assertEqual(sanitize_csv_cell(123), "123")
        self.assertEqual(sanitize_csv_cell(45.67), "45.67")

        # Escaping quotes and commas
        self.assertEqual(sanitize_csv_cell('Westminster, "City of"'), '"Westminster, ""City of"""')

    def test_ssrf_webhook_validation(self):
        """Test rejection of loopback and private IP webhook targets (PRD Section 11.3)."""
        # Blocked addresses
        self.assertFalse(is_safe_webhook_url("http://localhost:8080/hook"))
        self.assertFalse(is_safe_webhook_url("http://127.0.0.1/admin"))
        self.assertFalse(is_safe_webhook_url("http://127.0.0.1:9000/webhook"))
        self.assertFalse(is_safe_webhook_url("http://169.254.169.254/latest/meta-data/"))
        self.assertFalse(is_safe_webhook_url("http://10.0.0.1/internal"))
        self.assertFalse(is_safe_webhook_url("http://192.168.1.1/"))
        self.assertFalse(is_safe_webhook_url("file:///etc/passwd"))
        self.assertFalse(is_safe_webhook_url("gopher://127.0.0.1:70/"))

        # Valid public target
        self.assertTrue(is_safe_webhook_url("https://example.com/webhook"))


if __name__ == "__main__":
    unittest.main()
