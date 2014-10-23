
TESTS = $(wildcard test/*.js)
SRC = $(wildcard lib/*.js)
GREP ?=.

ifndef NODE_ENV
include node_modules/make-lint/index.mk
endif

test: lint test-style
	@TZ=UTC ./node_modules/.bin/mocha $(TESTS) \
		--timeout 20000 \
		--require should \
		--reporter spec \
		--inline-diffs \
		--grep "$(GREP)"

test-cov:
	@node_modules/.bin/istanbul cover \
		node_modules/.bin/_mocha $(TESTS) \
			--report lcovonly \
			-- -u exports \
			--timeout 20s \
			--require should \
			--reporter spec \
			--inline-diffs

test-style:
	@node_modules/.bin/jscs lib

clean:
	rm -rf coverage

.PHONY: test
