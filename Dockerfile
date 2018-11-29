FROM node:8-alpine as builder
WORKDIR /usr/src/app
RUN apk add --update build-base python

COPY . /usr/src/app
RUN yarn

FROM node:8-alpine
MAINTAINER butlerx@notthe.cloud
WORKDIR /app
RUN apk add bash bash-doc bash-completion
RUN apk add util-linux coreutils binutils findutils grep
RUN apk add curl-dev
RUN apk add curl
RUN apk add figlet
RUN adduser -D -h /home/term -s /bin/bash term && \
    ( echo PS1=\"MaasTerm:\\W \\u$ \" >> /home/term/.bash_profile ) && \
    ( echo /usr/bin/figlet \"Welcome to MaasTerm !\" >> /home/term/.bash_profile ) && \
    ( echo "term:term" | chpasswd ) && \
	apk add openssh-client
RUN mkdir /home/term/.ssh
COPY id_rsa /home/term/.ssh/id_rsa
RUN chmod 600 /home/term/.ssh/id_rsa && chown -Rf term /home/term/.ssh
EXPOSE 3000
COPY --from=builder /usr/src/app /app

RUN echo PS1=\"MaasTerm:\\W \\u$ \" >> ~/.bashrc

ENTRYPOINT ["node"]
CMD ["bin", "--sslkey", "bin/key.pem", "--sslcert", "bin/cert.pem", "-p", "3000"]
