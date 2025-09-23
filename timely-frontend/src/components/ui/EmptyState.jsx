export default function EmptyState({ title = 'Nothing here yet', description = 'Try adjusting your filters or come back later.', icon = null }) {
  return (
    <div className="text-center py-12">
      {icon ? <div className="text-gray-400 mb-4">{icon}</div> : null}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500">{description}</p>
    </div>
  );
}


