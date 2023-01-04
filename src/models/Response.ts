export const responseOk = {
  statusCode: 200,
  body: "",
};

export const responseForbidden = {
  statusCode: 403,
  body: "",
};

export const responseError = (routeKey: string) => {
  return {
    statusCode: 500,
    body: `A ${routeKey} não existe.`,
  };
};

export class HandlerError extends Error {}
