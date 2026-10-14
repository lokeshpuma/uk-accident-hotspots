#!/usr/bin/env python3
"""
services/enrichment/economics.py
Vision Zero Economic Impact and DfT WebTAG casualty valuation engine (Section 18.4).
Official UK Department for Transport (DfT) WebTAG Unit A4.1 Casualty Values (2024 GBP):
- Fatal: £2,254,499
- Serious: £253,353
- Slight: £19,534
- Damage-only overhead: £5,820
"""

from typing import Dict, List, Any


DFT_WEBTAG_VALUES = {
    "fatal": 2_254_499.0,
    "serious": 253_353.0,
    "slight": 19_534.0,
    "damage_only": 5_820.0
}


class EconomicsEngine:
    @staticmethod
    def calculate_cost(fatal: int, serious: int, slight: int, total_collisions: int = 0) -> float:
        """Computes total societal loss according to DfT formula."""
        cost = (
            fatal * DFT_WEBTAG_VALUES["fatal"] +
            serious * DFT_WEBTAG_VALUES["serious"] +
            slight * DFT_WEBTAG_VALUES["slight"] +
            total_collisions * DFT_WEBTAG_VALUES["damage_only"]
        )
        return round(cost, 2)

    @classmethod
    def evaluate_hotspots(cls, hotspots: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Summarizes economic loss across given hotspots."""
        total_fatal = 0
        total_serious = 0
        total_slight = 0
        total_collisions = 0
        hotspot_costs = []

        for h in hotspots:
            f = h.get("fatal", 0)
            s = h.get("serious", 0)
            sl = h.get("slight", 0)
            c = h.get("collisions", f + s + sl)
            cost = cls.calculate_cost(f, s, sl, c)

            total_fatal += f
            total_serious += s
            total_slight += sl
            total_collisions += c

            hotspot_costs.append({
                "rank": h.get("rank"),
                "cell": h.get("cell"),
                "band": h.get("band"),
                "score": h.get("score"),
                "fatal": f,
                "serious": s,
                "slight": sl,
                "collisions": c,
                "economic_loss_gbp": cost,
                "formatted_loss": f"£{cost:,.2f}"
            })

        total_loss = cls.calculate_cost(total_fatal, total_serious, total_slight, total_collisions)

        return {
            "total_societal_loss_gbp": total_loss,
            "formatted_total_loss": f"£{total_loss:,.2f}",
            "breakdown": {
                "fatal_count": total_fatal,
                "serious_count": total_serious,
                "slight_count": total_slight,
                "fatal_loss_gbp": total_fatal * DFT_WEBTAG_VALUES["fatal"],
                "serious_loss_gbp": total_serious * DFT_WEBTAG_VALUES["serious"],
                "slight_loss_gbp": total_slight * DFT_WEBTAG_VALUES["slight"]
            },
            "hotspots": hotspot_costs
        }

    @classmethod
    def simulate_roi(cls, target_hotspots: List[Dict[str, Any]], reduction_pct: float = 20.0,
                      patrol_hours: float = 120.0, cost_per_hour: float = 65.0) -> Dict[str, Any]:
        """Vision Zero ROI Simulator (Section 18.4.3).
        Calculates:
        - Prevented casualties
        - Gross societal savings (£)
        - Intervention cost (£)
        - Net benefit (£)
        - Benefit-to-Cost Ratio (BCR)
        """
        reduction_rate = max(0.0, min(100.0, reduction_pct)) / 100.0
        intervention_cost = patrol_hours * cost_per_hour

        total_f = sum(h.get("fatal", 0) for h in target_hotspots)
        total_s = sum(h.get("serious", 0) for h in target_hotspots)
        total_sl = sum(h.get("slight", 0) for h in target_hotspots)
        total_c = sum(h.get("collisions", 0) for h in target_hotspots)

        saved_f = round(total_f * reduction_rate, 2)
        saved_s = round(total_s * reduction_rate, 2)
        saved_sl = round(total_sl * reduction_rate, 2)

        gross_savings = (
            saved_f * DFT_WEBTAG_VALUES["fatal"] +
            saved_s * DFT_WEBTAG_VALUES["serious"] +
            saved_sl * DFT_WEBTAG_VALUES["slight"] +
            (total_c * reduction_rate) * DFT_WEBTAG_VALUES["damage_only"]
        )

        net_benefit = gross_savings - intervention_cost
        bcr = round(gross_savings / (intervention_cost + 1e-4), 2)

        return {
            "reduction_percentage": reduction_pct,
            "patrol_hours": patrol_hours,
            "intervention_cost_gbp": intervention_cost,
            "prevented_casualties": {
                "fatal": saved_f,
                "serious": saved_s,
                "slight": saved_sl
            },
            "gross_societal_savings_gbp": round(gross_savings, 2),
            "net_benefit_gbp": round(net_benefit, 2),
            "bcr": bcr,
            "verdict": "HIGH_VALUE_INTERVENTION" if bcr >= 4.0 else "POSITIVE_RETURN"
        }
