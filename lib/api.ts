import { Content, createClient } from "newt-client-js";
import { Member } from "../types/member";
import { Position } from "../types/position";

const client = createClient({
  spaceUid: process.env.NEXT_PUBLIC_NEWT_SPACE_UID,
  token: process.env.NEXT_PUBLIC_NEWT_API_TOKEN,
  apiType: process.env.NEXT_PUBLIC_NEWT_API_TYPE as "cdn" | "api",
});

export const fetchApp = async () => {
  const app = await client.getApp({
    appUid: process.env.NEXT_PUBLIC_NEWT_APP_UID,
  });
  return app;
};

export const fetchPositions = async () => {
  const { items } = await client.getContents<Content & Position>({
    appUid: process.env.NEXT_PUBLIC_NEWT_APP_UID,
    modelUid: process.env.NEXT_PUBLIC_NEWT_POSITION_MODEL_UID,
    query: {
      depth: 1,
    },
  });
  return items;
};

export const fetchMembers = async (options?: {
  query?: Record<string, any>;
  search?: string;
  position?: string;
  page?: number;
  limit?: number;
  format?: string;
}) => {
  const { query, search, position, page, limit, format } = options || {};
  const _query = {
    ...(query || {}),
  };
  if (search) {
    _query.or = [
      {
        fullName: {
          match: search,
        },
      },
      {
        biography: {
          match: search,
        },
      },
    ];
  }
  if (position) {
    _query.position = position;
  }
  const _page = page || 1;
  const _limit = limit || Number(process.env.NEXT_PUBLIC_PAGE_LIMIT) || 10;
  const _skip = (_page - 1) * _limit;

  const { items, total } = await client.getContents<Content & Member>({
    appUid: process.env.NEXT_PUBLIC_NEWT_APP_UID,
    modelUid: process.env.NEXT_PUBLIC_NEWT_MEMBER_MODEL_UID,
    query: {
      depth: 2,
      limit: _limit,
      skip: _skip,
      ..._query,
    },
  });
  return {
    members: items,
    total,
  };
};

export const getPages = async (options?: { position?: string }) => {
  const { total } = await fetchMembers(options);
  const pages = Array(
    Math.ceil(total / Number(process.env.NEXT_PUBLIC_PAGE_LIMIT) || 10)
  )
    .fill(true)
    .map((value, index) => ({
      number: index + 1,
    }));
  return pages;
};

export const fetchCurrentMember = async (options: { slug: string }) => {
  const { slug } = options;
  if (!slug) return null;
  const member = await client.getFirstContent({
    appUid: process.env.NEXT_PUBLIC_NEWT_APP_UID,
    modelUid: process.env.NEXT_PUBLIC_NEWT_MEMBER_MODEL_UID,
    query: {
      depth: 2,
      slug,
    },
  });
  return member;
};
