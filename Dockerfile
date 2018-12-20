FROM openjdk:latest
MAINTAINER rodrigo.geve@solace.com

WORKDIR /app

ARG TERMUSER=term
ARG TERMUSERPW=term
ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get update 
RUN apt-get install -y --no-install-recommends apt-utils
RUN apt-get install sudo -y
RUN apt-get install -y python2.7
RUN curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
RUN apt-get install -y nodejs

RUN apt-get install util-linux coreutils binutils findutils grep
RUN apt-get install curl
RUN apt-get install figlet

RUN apt-get install -y build-essential

RUN groupadd $TERMUSER
RUN useradd -d /home/$TERMUSER -ms /bin/bash -g $TERMUSER -p $TERMUSERPW $TERMUSER
RUN bash -c "echo $TERMUSER:$TERMUSERPW | chpasswd"
RUN echo PS1=\"MaasTerm:\\W \\u$ \" >> /home/$TERMUSER/.bash_profile
RUN echo figlet 'Welcome to MaasTerm!' >> /home/$TERMUSER/.bash_profile
RUN apt-get install openssh-client
RUN mkdir /home/$TERMUSER/.ssh
COPY id_rsa /home/$TERMUSER/.ssh/id_rsa
RUN chmod 600 /home/$TERMUSER/.ssh/id_rsa && chown -Rf $TERMUSER /home/$TERMUSER/.ssh

COPY . /app
RUN npm install
EXPOSE 3000

ENTRYPOINT ["node"]
CMD ["bin", "--sslkey", "bin/key.pem", "--sslcert", "bin/cert.pem", "-p", "3000"]
