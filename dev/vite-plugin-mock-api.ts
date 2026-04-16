import type { Plugin } from 'vite';

/**
 * 本地开发 Mock：避免请求指向无效外网域名导致 Network Error。
 * 生产构建不会注入该插件。
 */
export function vitePluginMockApi(): Plugin {
  const mockProducts = Array.from({ length: 15 }, (_, index) => {
    const id = String(index + 1);
    const basePrice = 59 + index * 10;
    const baseStock = Math.max(10, 35 - index);
    const imageA = 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg';
    const imageB = 'https://fastly.jsdelivr.net/npm/@vant/assets/dog.jpeg';
    const useCatAsMain = index % 2 === 0;
    return {
      id,
      name: `示例商品 ${String.fromCharCode(65 + index)}`,
      desc: `第 ${id} 件 Mock 商品，用于列表与详情联调。`,
      price: basePrice,
      mainImage: useCatAsMain ? imageA : imageB,
      images: [useCatAsMain ? imageA : imageB, useCatAsMain ? imageB : imageA],
      skus: [
        { id: `${id}-s1`, name: '标准版', price: basePrice, stock: baseStock },
        {
          id: `${id}-s2`,
          name: '礼盒装',
          price: basePrice + 20,
          stock: Math.max(3, Math.floor(baseStock / 2)),
        },
      ],
      stock: baseStock,
    };
  });

  const mockUser = {
    id: 'u-10001',
    phone: '13800000000',
    nickname: '测试用户',
    avatar: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg',
  };

  const readRequestBody = async (req: NodeJS.ReadableStream): Promise<string> =>
    new Promise((resolve) => {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });
      req.on('end', () => resolve(body));
      req.on('error', () => resolve(''));
    });

  return {
    name: 'vite-plugin-mock-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url) {
          next();
          return;
        }

        const url = new URL(req.url, 'http://localhost');

        if (req.method === 'POST' && url.pathname === '/api/auth/send-code') {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ success: true }));
          return;
        }

        if (req.method === 'POST' && url.pathname === '/api/auth/login') {
          void readRequestBody(req).then((rawBody) => {
            const body = rawBody
              ? (JSON.parse(rawBody) as { phone?: string; password?: string })
              : {};
            res.setHeader('Content-Type', 'application/json; charset=utf-8');

            if (body.phone === '13800000000' && body.password === '123456') {
              res.end(
                JSON.stringify({
                  token: 'mock-token-13800000000',
                  user: mockUser,
                }),
              );
              return;
            }

            res.statusCode = 400;
            res.end(JSON.stringify({ message: '手机号或验证码错误' }));
          });
          return;
        }

        if (req.method === 'GET' && url.pathname === '/api/user/profile') {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify(mockUser));
          return;
        }

        if (req.method !== 'GET') {
          next();
          return;
        }

        if (url.pathname === '/api/products') {
          const page = Number(url.searchParams.get('page') || '1');
          const pageSize = Number(url.searchParams.get('pageSize') || '10');
          const keyword = (url.searchParams.get('keyword') || '')
            .trim()
            .toLowerCase();
          const filtered = keyword
            ? mockProducts.filter((item) =>
                `${item.name} ${item.desc}`.toLowerCase().includes(keyword),
              )
            : mockProducts;
          const start = (page - 1) * pageSize;
          const end = start + pageSize;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify(filtered.slice(start, end)));
          return;
        }

        if (url.pathname === '/api/product/search') {
          const keyword = (url.searchParams.get('keyword') || '')
            .trim()
            .toLowerCase();
          const page = Number(url.searchParams.get('page') || '1');
          const size = Number(url.searchParams.get('size') || '10');
          const filtered = keyword
            ? mockProducts.filter((item) =>
                `${item.name} ${item.desc}`.toLowerCase().includes(keyword),
              )
            : [];
          const start = (page - 1) * size;
          const end = start + size;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(
            JSON.stringify({
              list: filtered.slice(start, end),
              page,
              size,
              total: filtered.length,
            }),
          );
          return;
        }

        const detailMatch = url.pathname.match(/^\/api\/products\/([^/]+)$/);
        if (detailMatch) {
          const id = detailMatch[1];
          const found =
            mockProducts.find((item) => item.id === id) ?? mockProducts[0];
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ ...found, id }));
          return;
        }

        next();
      });
    },
  };
}
