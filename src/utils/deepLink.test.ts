import { describe, expect, it } from 'vitest';
import {
  buildPracticeDeepLinkPath,
  buildShareAppUrl,
  parsePracticeDeepLink,
  vkAppUrlForTests,
} from '@/utils/deepLink';

describe('practice deep links', () => {
  it('parses m/s/t/ref', () => {
    expect(parsePracticeDeepLink('?m=smile&ref=wall')).toEqual({
      meditationId: 'smile',
      sadhanaId: undefined,
      timer: undefined,
      ref: 'wall',
    });
    expect(parsePracticeDeepLink('s=morning-short&t=1')).toMatchObject({
      sadhanaId: 'morning-short',
      timer: true,
    });
  });

  it('builds session path with setup for sadhana/timer', () => {
    expect(buildPracticeDeepLinkPath({ meditationId: 'om-short', ref: 'story' })).toBe(
      '/session?m=om-short&ref=story',
    );
    expect(buildPracticeDeepLinkPath({ sadhanaId: 'morning-short', ref: 'wall' })).toContain(
      's=morning-short',
    );
    expect(buildPracticeDeepLinkPath({ sadhanaId: 'morning-short' })).toContain('setup=1');
    expect(buildPracticeDeepLinkPath({ timer: true })).toContain('t=1');
  });

  it('share URL uses VK hash deep-link', () => {
    const url = buildShareAppUrl({ meditationId: 'smile', ref: 'link' });
    expect(url.startsWith(vkAppUrlForTests())).toBe(true);
    expect(url).toContain('#/session?');
    expect(url).toContain('m=smile');
    expect(url).toContain('ref=link');
  });
});
