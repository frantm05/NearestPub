import React from 'react';
import { act, render } from '@testing-library/react-native';

import { VenueMarker } from '../VenueMarker';
import { SettingsProvider } from '../../state/SettingsProvider';
import { ThemeProvider } from '../../theme/ThemeProvider';

function renderMarker(ui: React.ReactElement) {
  return render(
    <SettingsProvider>
      <ThemeProvider>{ui}</ThemeProvider>
    </SettingsProvider>,
  );
}

/** Flushes SettingsProvider's async hydration so tests end in a settled tree. */
async function flushHydration() {
  await act(async () => {});
}

describe('VenueMarker — zoom-tiered beer pin', () => {
  it('shows the price label at full detail', async () => {
    const screen = renderMarker(<VenueMarker label="45 Kč" selected={false} tier="full" />);
    await flushHydration();

    expect(screen.getByText('45 Kč')).toBeTruthy();
  });

  it('hides the price at compact detail (glyph-only pin)', async () => {
    const screen = renderMarker(
      <VenueMarker label="45 Kč" selected={false} tier="compact" />,
    );
    await flushHydration();

    expect(screen.queryByText('45 Kč')).toBeNull();
  });

  it.each(['full', 'compact', 'dot'] as const)(
    'renders the %s tier, selected and unselected',
    async (tier) => {
      const unselected = renderMarker(
        <VenueMarker label="52 Kč" selected={false} tier={tier} />,
      );
      await flushHydration();
      expect(unselected.toJSON()).toBeTruthy();

      const selected = renderMarker(<VenueMarker label="52 Kč" selected tier={tier} />);
      await flushHydration();
      expect(selected.toJSON()).toBeTruthy();
    },
  );
});
