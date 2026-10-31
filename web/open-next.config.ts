import { defineCloudflareConfig } from '@opennextjs/cloudflare';

export default defineCloudflareConfig({
  // incremental cache / ISR not needed for this app; defaults are fine.
});
