
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";

// TODO: Replace with real-time bandwidth data from MikroTik API
// This will require integration with monitoring service
const data = [
  { time: "00:00", download: 2.1, upload: 0.8 },
  { time: "02:00", download: 1.4, upload: 0.5 },
  { time: "04:00", download: 1.0, upload: 0.4 },
  { time: "06:00", download: 1.5, upload: 0.6 },
  { time: "08:00", download: 5.2, upload: 1.8 },
  { time: "10:00", download: 7.5, upload: 2.1 },
  { time: "12:00", download: 6.8, upload: 1.9 },
  { time: "14:00", download: 7.2, upload: 2.0 },
  { time: "16:00", download: 8.5, upload: 2.3 },
  { time: "18:00", download: 9.2, upload: 2.8 },
  { time: "20:00", download: 8.1, upload: 2.5 },
  { time: "22:00", download: 5.5, upload: 1.8 },
];

export function BandwidthChart() {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="text-base font-medium">Penggunaan Bandwidth</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="downloadGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0a85ff" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#0a85ff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="uploadGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0c3979" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#0c3979" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="time" fontSize={12} />
              <YAxis unit=" Mbps" fontSize={12} />
              <Tooltip 
                formatter={(value: number) => [`${value} Mbps`, undefined]}
                labelFormatter={(label) => `Waktu: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="download"
                name="Download"
                stroke="#0a85ff"
                fillOpacity={1}
                fill="url(#downloadGradient)"
              />
              <Area
                type="monotone"
                dataKey="upload"
                name="Upload"
                stroke="#0c3979"
                fillOpacity={1}
                fill="url(#uploadGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6 mt-2">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-rtwnet-500"></div>
            <span className="text-sm text-muted-foreground">Download</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-rtwnet-900"></div>
            <span className="text-sm text-muted-foreground">Upload</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
