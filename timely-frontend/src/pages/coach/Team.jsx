import { useParams } from 'react-router-dom';

export default function CoachTeam() {
  const { id } = useParams();
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold mb-4">Team {id}</h1>
      <p className="text-sm text-gray-600">Team page coming soon.</p>
    </div>
  );
}


