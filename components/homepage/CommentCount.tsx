import { useEffect, useState } from 'react';

const CommentCount = () => {
  const [count, setCount] = useState<number | null>(15397);

  // useEffect(() => {
  //   fetch('/api/comment-count')
  //     .then(res => res.json())
  //     .then(data => setCount(data.count))
  //     .catch(() => setCount(null));
  // }, []);

  return (
    <div className="text-base text-gray-700 dark:text-gray-300 mt-4">
      <span className='text-amber-500 font-semibold'>{count}</span> comments has been generated
    </div>
  );
};

export default CommentCount;