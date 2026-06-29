export type Job = {
  id: string;
  dir: string;
};

export type JobMetadata = {
  sourceUrl: string;
  title: string;
  mediaPath: string;
  mediaFilename: string;
  transcriptPath: string;
  transcriptFilename: string;
  createdAt: string;
};
