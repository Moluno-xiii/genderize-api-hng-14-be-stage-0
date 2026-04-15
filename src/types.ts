type GenderizeResponse = {
  count: number;
  name: string;
  gender: string | null;
  probability: number;
};

type ClassifyResponseSuccess = APISuccessResponse<
  Pick<GenderizeResponse, 'gender' | 'probability' | 'name'> & {
    sample_size: number;
    is_confident: boolean;
    processed_at: string;
  }
>;

type ClassifyResponseError = {
  status: 'error';
  message: string;
};

type APISuccessResponse<T> = {
  status: 'success';
  message?: string;
  data: T;
  count?: number;
};

export type {
  GenderizeResponse,
  ClassifyResponseSuccess,
  ClassifyResponseError,
  APISuccessResponse,
};
