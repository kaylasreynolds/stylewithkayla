import assert from "node:assert/strict";
import test from "node:test";

import {
  capacityAvailable,
  canTransitionEvent,
  csvCell,
  rangesOverlap,
} from "../lib/server/event-management";

import {
  instant,
  publicEventJson,
} from "../lib/server/event-management-core";

import { requireAdmin } from "../lib/server/admin-auth";
import {
  EVENT_IMAGE_MAX_BYTES,
  eventAssetOwnedBy,
  inspectEventImage,
  meaningfulAlt,
} from "../lib/server/event-images";