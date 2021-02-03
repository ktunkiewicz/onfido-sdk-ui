FROM hayd/deno:1.5.2

EXPOSE 8080

WORKDIR /app

USER deno

COPY lock.json /app/
COPY /src/* /app/src/
COPY /certs/* /app/certs/
COPY /frontend/* /app/frontend/
RUN deno cache src/deps.ts --lock=lock.json

WORKDIR /app/src

CMD ["run", "--allow-net", "--allow-read", "--allow-write", "server.ts"]
