import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-4xl font-bold">Timely is running</h1>
      <p className="mt-3 opacity-80">If you can see this, routing and rendering are OK.</p>
      <Link to="/events" className="inline-block mt-6 border rounded px-4 py-2 underline">
        Browse Events
      </Link>
    </div>
  );
}
