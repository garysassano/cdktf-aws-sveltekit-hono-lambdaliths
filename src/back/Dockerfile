FROM node:17.8-alpine

COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.8.0 /lambda-adapter /opt/extensions/lambda-adapter

ENV AWS_LWA_PORT=4000

WORKDIR /app

COPY . ./

RUN yarn install && yarn build

EXPOSE 4000

CMD [ "yarn", "run", "start" ]
