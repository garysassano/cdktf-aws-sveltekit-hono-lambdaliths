FROM public.ecr.aws/docker/library/node:20-slim
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.8.1 /lambda-adapter /opt/extensions/lambda-adapter
ENV AWS_LWA_PORT=4000
WORKDIR /var/task
ADD . /var/task
RUN yarn install && yarn build
EXPOSE 4000
CMD [ "yarn", "run", "start" ]