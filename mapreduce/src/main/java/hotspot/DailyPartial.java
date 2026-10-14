package hotspot;

import java.io.IOException;
import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.io.LongWritable;
import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Mapper;
import org.apache.hadoop.mapreduce.Reducer;

/**
 * Phase 4 / Section 8.5 Incremental Batch Job 1: DailyPartial
 * Processes a single closed day's raw data: raw/dt=YYYY-MM-DD
 * De-duplicates by collision_index, then aggregates per cell|band:
 * Output: cell|band \t n_fatal \t n_serious \t n_slight \t lat_sum \t lon_sum
 */
public class DailyPartial {

    public static class DedupMapper extends Mapper<LongWritable, Text, Text, Text> {
        private final Text k = new Text(), v = new Text();
        private double cell;

        @Override
        protected void setup(Context ctx) {
            cell = ctx.getConfiguration().getDouble(Hs.CELL, 0.02);
        }

        @Override
        protected void map(LongWritable off, Text line, Context ctx)
                throws IOException, InterruptedException {
            String[] f = line.toString().split("\t");
            if (f.length < 6) return;
            try {
                String id = f[0];
                int hour = Integer.parseInt(f[2].substring(0, 2));
                double lat = Double.parseDouble(f[3]);
                double lon = Double.parseDouble(f[4]);
                int sev = Integer.parseInt(f[5]);

                long li = (long) Math.floor(lat / cell);
                long oi = (long) Math.floor(lon / cell);
                String cellBand = li + ":" + oi + "|" + Hs.band(hour);

                k.set(id); // collision_index
                v.set(cellBand + "\t" + lat + "\t" + lon + "\t" + sev);
                ctx.write(k, v);
            } catch (RuntimeException ignored) {
            }
        }
    }

    public static class AggregateReducer extends Reducer<Text, Text, Text, Text> {
        private final Text outK = new Text(), outV = new Text();

        @Override
        protected void reduce(Text id, Iterable<Text> vals, Context ctx)
                throws IOException, InterruptedException {
            // Pick first (deduplicated)
            for (Text t : vals) {
                String[] p = t.toString().split("\t");
                String cellBand = p[0];
                double lat = Double.parseDouble(p[1]);
                double lon = Double.parseDouble(p[2]);
                int sev = Integer.parseInt(p[3]);

                long f = (sev == 1) ? 1 : 0;
                long s = (sev == 2) ? 1 : 0;
                long sl = (sev >= 3) ? 1 : 0;

                outK.set(cellBand);
                outV.set(f + "\t" + s + "\t" + sl + "\t" + lat + "\t" + lon);
                ctx.write(outK, outV);
                break;
            }
        }
    }
}
