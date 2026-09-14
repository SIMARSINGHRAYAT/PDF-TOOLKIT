import assert from "node:assert/strict";
import test from "node:test";
import { groupConsecutivePages, parsePageRange } from "@/lib/file-utils";

test("parsePageRange parses single pages and ranges", () => {
  assert.deepEqual(parsePageRange("1-3, 5, 8-10", 12), [1, 2, 3, 5, 8, 9, 10]);
});

test("parsePageRange clamps out-of-range values", () => {
  assert.deepEqual(parsePageRange("0,2,20,4-6", 5), [2, 4, 5]);
});

test("groupConsecutivePages groups sequences", () => {
  assert.deepEqual(groupConsecutivePages([1, 2, 3, 7, 8, 10]), [[1, 2, 3], [7, 8], [10]]);
});
