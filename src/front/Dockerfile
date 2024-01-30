FROM --platform=${TARGETPLATFORM} public.ecr.aws/docker/library/node:20-slim AS base
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.8.1 /lambda-adapter /opt/extensions/lambda-adapter

WORKDIR /var/task
COPY . /var/task

RUN npm install && npm run build

ENV BACKEND_API_URL=https://qh5yf2q5mb2mudnu7mo5ibs5340kvlew.lambda-url.eu-central-1.on.aws/ 
ENV CLIENT_API_URL=https://qh5yf2q5mb2mudnu7mo5ibs5340kvlew.lambda-url.eu-central-1.on.aws/
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000
ENV AWS_LWA_PORT=3000
EXPOSE 3000

CMD [ "node", "start" ]
