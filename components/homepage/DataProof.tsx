
const DataProof = ({
  users,
  comments,
  average_time
}: {
  users: number,
  comments: number,
  average_time: number
}) => {
  return (
    <div className="w-full px-8 md:px-32 flex flex-col lg:flex-row items-center justify-center gap-16">
      <div id="users" className="flex flex-col w-full lg:w-1/3 items-center justify-center whitespace-nowrap gap-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4">
        <span className="text-base font-bold text-gray-500 dark:text-gray-400 text-center">Active Users</span>
        <span className="text-4xl font-bold text-amber-500 text-center">{users}+</span>
        <span className="text-base text-gray-500 dark:text-gray-400 text-center">Users trust our product</span>
      </div>

      <div id="users" className="flex flex-col w-full lg:w-1/3 items-center justify-center whitespace-nowrap gap-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4">
        <span className="text-base font-bold text-gray-500 dark:text-gray-400 text-center">Generated Comments</span>
        <span className="text-4xl font-bold text-amber-500 text-center">{comments}</span>
        <span className="text-base text-gray-500 dark:text-gray-400 text-center">Comments has been generated</span>
      </div>

      <div id="users" className="flex flex-col w-full lg:w-1/3 items-center justify-center whitespace-nowrap gap-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4">
        <span className="text-base font-bold text-gray-500 dark:text-gray-400 text-center">Average Time</span>
        <span className="text-4xl font-bold text-amber-500 text-center">{average_time}s</span>
        <span className="text-base text-gray-500 dark:text-gray-400 text-center">Time taken to generate a comment</span>
      </div>
    </div>
  );
};

export default DataProof;
