import { GitHubCalendar, type Activity } from "react-github-calendar";
import { useCallback, useEffect, useRef } from "react";

const GithubGraph = () => {
  const calendar = useRef<HTMLDivElement>(null), ready = useRef(false), frame = useRef(0);
  // This callback receives genuine fetched data, never the loading placeholder.
  const preserveData = useCallback((data: Activity[]) => {
    if (!ready.current) {
      ready.current = true;
      frame.current = requestAnimationFrame(() => {
        if (calendar.current) calendar.current.dataset.activityReady = "true";
        window.dispatchEvent(new Event("portfolio:activity-ready"));
      });
    }
    return data;
  }, []);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);
  return (
    <div className="border-4 border-black p-4 bg-white text-black hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-300">
      <h3 className="font-mono text-xl font-bold mb-4 border-b-2 border-black pb-2 uppercase tracking-tighter">
        GitHub Activity_
      </h3>
      <div ref={calendar} data-construction="asset" data-construction-scene="activity" className="flex justify-center overflow-x-auto pb-2">
        <GitHubCalendar
          username="abdoabozena7"
          errorMessage={'Error – Fetching GitHub contribution data for "abdoabozena7" failed.'}
          transformData={preserveData}
          colorScheme="light"
          style={{
            fontFamily: "monospace",
          }}
          theme={{
            light: ["#faecb6", "#93d3ae", "#2bbaa5", "#f9a822", "#f96635"],
          }}
          blockSize={12}
          blockMargin={4}
          fontSize={12}
        />
      </div>
      <div className="mt-2 text-right font-mono text-xs text-gray-600">
        // contribs over last year
      </div>
    </div>
  );
};

export default GithubGraph;
