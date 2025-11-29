import { baseApi } from './baseApi';
import type { ContactRequest, ContactResponse } from '@/types';

export const contactApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    sendContactMessage: builder.mutation<ContactResponse, ContactRequest>({
      query: (body) => ({
        url: '/contact',
        method: 'POST',
        body,
      }),
    }),
  }),
  overrideExisting: false,
});

export const { useSendContactMessageMutation } = contactApi;
