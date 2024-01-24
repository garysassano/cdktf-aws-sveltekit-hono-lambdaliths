FROM node:17.8-alpine
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.8.1 /lambda-adapter /opt/extensions/lambda-adapter
ENV AWS_LWA_PORT=4000
WORKDIR /var/task
ADD package.json /var/task/package.json
ADD yarn.lock /var/task/yarn.lock
RUN yarn install
ADD . /var/task
EXPOSE 4000
CMD [ "yarn", "run", "start" ]