#!/bin/sh 

docker-compose stop 
docker rm wetty
docker build -t rgeve/wetty --build-arg TERMUSER=tester --build-arg TERMUSERPW=tester .
docker-compose up -d
