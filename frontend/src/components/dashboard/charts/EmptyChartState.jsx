export const EmptyChartState = ({ icon: Icon, message }) => (
  <div className="h-300 flex items-center justify-center text-gray-500">
    <div className="text-center">
      <Icon className="h-12 w-12 mx-auto mb-2 opacity-50" />
      <p>{message}</p>
    </div>
  </div>
);
