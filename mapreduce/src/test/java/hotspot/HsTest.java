package hotspot;

import static org.junit.Assert.*;
import org.junit.Test;

public class HsTest {

    @Test
    public void testTimeBandBoundaries() {
        // AM_PEAK: 07-09
        assertEquals("AM_PEAK", Hs.band(7));
        assertEquals("AM_PEAK", Hs.band(8));
        assertEquals("AM_PEAK", Hs.band(9));

        // PM_PEAK: 16-18
        assertEquals("PM_PEAK", Hs.band(16));
        assertEquals("PM_PEAK", Hs.band(17));
        assertEquals("PM_PEAK", Hs.band(18));

        // NIGHT: 19-23 and 00-04
        assertEquals("NIGHT", Hs.band(19));
        assertEquals("NIGHT", Hs.band(22));
        assertEquals("NIGHT", Hs.band(23));
        assertEquals("NIGHT", Hs.band(0));
        assertEquals("NIGHT", Hs.band(2));
        assertEquals("NIGHT", Hs.band(4));

        // DAY: 05-06 and 10-15
        assertEquals("DAY", Hs.band(5));
        assertEquals("DAY", Hs.band(6));
        assertEquals("DAY", Hs.band(10));
        assertEquals("DAY", Hs.band(12));
        assertEquals("DAY", Hs.band(15));
    }

    @Test
    public void testSeverityWeights() {
        assertEquals(10.0, Hs.severityWeight(1), 1e-6);
        assertEquals(5.0, Hs.severityWeight(2), 1e-6);
        assertEquals(1.0, Hs.severityWeight(3), 1e-6);
        assertEquals(1.0, Hs.severityWeight(0), 1e-6); // other default
    }

    @Test
    public void testCellCoordinateMath() {
        // Test Cartesian cell indexing floor(coord / 0.02)
        double cell = 0.02;
        long latIdx = (long) Math.floor(51.5106 / cell);
        long lonIdx = (long) Math.floor(-0.1300 / cell);

        assertEquals(2575L, latIdx);
        assertEquals(-7L, lonIdx);

        // Negative coordinate boundary check
        assertEquals(-1L, (long) Math.floor(-0.01 / cell));
        assertEquals(-1L, (long) Math.floor(-0.02 / cell));
        assertEquals(-2L, (long) Math.floor(-0.020001 / cell));
    }

    @Test
    public void testTopNTieBreaking() {
        TopN.Rec r1 = new TopN.Rec("2575:-7|DAY\t20.5000\t...");
        TopN.Rec r2 = new TopN.Rec("2575:-8|DAY\t20.5000\t...");

        // Higher member string wins ties in descending rank, so natural ascending compareTo should yield r1 < r2
        assertTrue(r1.compareTo(r2) < 0);
    }
}
