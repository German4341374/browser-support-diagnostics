.PHONY: setup lint test privacy build check clean

setup:
	npm ci

lint:
	npm run lint

test:
	npm run test

privacy:
	npm run privacy

build:
	npm run build

check:
	npm run check

clean:
	node -e "require('node:fs').rmSync('dist', { recursive: true, force: true }); require('node:fs').rmSync('coverage', { recursive: true, force: true })"
