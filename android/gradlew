#!/bin/sh
# Gradle wrapper shell script
DIR=$(cd "$(dirname "$0")" && pwd)
JAR="$DIR/gradle/wrapper/gradle-wrapper.jar"

if [ -f "$JAR" ]; then
    java -jar "$JAR" "$@"
else
    gradle "$@"
fi
