FROM golang:1.26-alpine

WORKDIR /app

ENV PATH="/go/bin:${PATH}"

RUN go install github.com/air-verse/air@latest

COPY go.mod go.sum ./

RUN go mod download

COPY . .

CMD ["air"]