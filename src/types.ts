type GenderizeResponse = {
  count: number;
  name: string;
  gender: string | null;
  probability: number;
};

type ClassifyResponseSuccess = {
  status: 'success';
  data: Pick<GenderizeResponse, 'gender' | 'probability' | 'name'> & {
    sample_size: number;
    is_confident: boolean;
    processed_at: string;
  };
};

type ClassifyResponseError = {
  status: 'error';
  message: string;
};

export type {
  GenderizeResponse,
  ClassifyResponseSuccess,
  ClassifyResponseError,
};
