package hotspot;

import java.io.IOException;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.PriorityQueue;

import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.fs.Path;
import org.apache.hadoop.io.LongWritable;
import org.apache.hadoop.io.NullWritable;
import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Mapper;
import org.apache.hadoop.mapreduce.Reducer;
import org.apache.hadoop.mapreduce.lib.input.FileSplit;

/**
 * Phase 4 / Section 8.5 Incremental Batch Job 2: WindowScoreTopN
 * Input: partial files from daily/dt=YYYY-MM-DD
 * Infers dt from file split path, calculates age, applies exponential decay,
 * and outputs cells and authoritative Top-N hotspots.
 */
public class WindowScoreTopN {

    public static class ScoreMapper extends Mapper<LongWritable, Text, Text, Text> {
        private LocalDate asof;
        private int window;
        private double halfLife;
        private final Text k = new Text(), v = new Text();

        @Override
        protected void setup(Context ctx) {
            Configuration c = ctx.getConfiguration();
            asof = LocalDate.parse(c.get(Hs.ASOF));
            window = c.getInt(Hs.WINDOW, 90);
            halfLife = c.getDouble(Hs.HALF, 30.0);
        }

        @Override
        protected void map(LongWritable off, Text line, Context ctx)
                throws IOException, InterruptedException {
            String[] p = line.toString().split("\t");
            if (p.length < 6) return;

            // Extract dt from file split directory: .../dt=YYYY-MM-DD/...
            FileSplit split = (FileSplit) ctx.getInputSplit();
            Path path = split.getPath();
            String pathStr = path.toString();
            int dtIdx = pathStr.indexOf("dt=");
            if (dtIdx == -1) return;
            String dtStr = pathStr.substring(dtIdx + 3, dtIdx + 13);

            try {
                LocalDate dt = LocalDate.parse(dtStr);
                long age = ChronoUnit.DAYS.between(dt, asof);
                if (age < 0 || age >= window) return;

                String cellBand = p[0];
                long f = Long.parseLong(p[1]);
                long s = Long.parseLong(p[2]);
                long sl = Long.parseLong(p[3]);
                double latSum = Double.parseDouble(p[4]);
                double lonSum = Double.parseDouble(p[5]);

                double decay = Math.pow(0.5, age / halfLife);
                double score = (f * 10.0 + s * 5.0 + sl * 1.0) * decay;
                long totalN = f + s + sl;

                k.set(cellBand);
                v.set(score + "\t" + totalN + "\t" + latSum + "\t" + lonSum + "\t" + f + "\t" + s + "\t" + sl);
                ctx.write(k, v);
            } catch (RuntimeException ignored) {
            }
        }
    }

    public static class AggregateReducer extends Reducer<Text, Text, NullWritable, Text> {
        private int topN;
        private final PriorityQueue<TopN.Rec> pq = new PriorityQueue<>();

        @Override
        protected void setup(Context ctx) {
            topN = ctx.getConfiguration().getInt(Hs.TOPN, 20);
        }

        @Override
        protected void reduce(Text key, Iterable<Text> vals, Context ctx)
                throws IOException, InterruptedException {
            double totalScore = 0.0;
            long totalN = 0, fatal = 0, serious = 0, slight = 0;
            double totalLat = 0.0, totalLon = 0.0;

            for (Text t : vals) {
                String[] p = t.toString().split("\t");
                totalScore += Double.parseDouble(p[0]);
                totalN += Long.parseLong(p[1]);
                totalLat += Double.parseDouble(p[2]);
                totalLon += Double.parseDouble(p[3]);
                fatal += Long.parseLong(p[4]);
                serious += Long.parseLong(p[5]);
                slight += Long.parseLong(p[6]);
            }

            if (totalN <= 0) return;
            double centLat = totalLat / totalN;
            double centLon = totalLon / totalN;

            String outLine = String.format(Locale.ROOT, "%s\t%.4f\t%d\t%.6f\t%.6f\t%d\t%d\t%d",
                    key.toString(), totalScore, totalN, centLat, centLon, fatal, serious, slight);

            TopN.offer(pq, new TopN.Rec(outLine), topN);
        }

        @Override
        protected void cleanup(Context ctx) throws IOException, InterruptedException {
            List<TopN.Rec> sorted = new ArrayList<>(pq);
            Collections.sort(sorted, Collections.reverseOrder());
            int rank = 1;
            for (TopN.Rec r : sorted) {
                ctx.write(NullWritable.get(), new Text(rank++ + "\t" + r.line));
            }
        }
    }
}
