export async function fetchLastCommit(owner: string, repo: string) {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`,
    {
      headers: {
        Accept: "application/vnd.github.v3+json",
      },
    }
  );
  if (!response.ok) {
    throw new Error("Failed to fetch commits");
  }
  const commits = await response.json();
  if (commits.length === 0) {
    throw new Error("No commits found");
  }
  const latestCommit = commits[0];
  return {
    sha: latestCommit.sha,
    date: latestCommit.commit.author.date,
  };
}