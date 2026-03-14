import axios from "axios";
export const getRandomPost = async (subreddit) => {
  const res = await axios.get(
    `https://www.reddit.com/r/${subreddit}/random.json`,
    {
      headers: {
        "User-Agent": "Lucy Discord Bot/1.0",
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9",
      },
    },
  );
  return {
    image: res.data[0].data.children[0].data.url,
    title: res.data[0].data.children[0].data.title,
  };
};
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */
