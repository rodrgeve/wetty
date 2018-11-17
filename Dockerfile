FROM node:8-alpine as builder
WORKDIR /usr/src/app
RUN apk add --update build-base python
COPY . /usr/src/app
RUN yarn

FROM node:8-alpine
MAINTAINER butlerx@notthe.cloud
WORKDIR /app
RUN adduser -D -h /home/term -s /bin/sh term && \
    ( echo "term:term" | chpasswd ) && \
	apk add openssh-client
RUN mkdir /home/term/.ssh
COPY id_rsa /home/term/.ssh/id_rsa
RUN chmod 600 /home/term/.ssh/id_rsa && chown -Rf term /home/term/.ssh
EXPOSE 3000
COPY --from=builder /usr/src/app /app

ENTRYPOINT ["node"]
CMD ["bin", "--sslkey", "bin/key.pem", "--sslcert", "bin/cert.pem", "-p", "3000"]
