'use strict';

import { isThemeColorId } from '../../src/ThemeColorId';

describe('isThemeColorId', () => {
    it('recognizes theme color ids.', () => {
        expect(isThemeColorId('terminal.ansiGreen')).toBe(true);
        expect(isThemeColorId('editorError.foreground')).toBe(true);
        expect(isThemeColorId('gitDecoration.modifiedResourceForeground')).toBe(true);
        expect(isThemeColorId('editorOverviewRuler.findMatchForeground')).toBe(true);
        expect(isThemeColorId(' terminal.ansiRed ')).toBe(true);
    });

    it('does not treat CSS colors as theme color ids.', () => {
        expect(isThemeColorId('red')).toBe(false);
        expect(isThemeColorId('darkred')).toBe(false);
        expect(isThemeColorId('#ff5588')).toBe(false);
        expect(isThemeColorId('#ff558880')).toBe(false);
        expect(isThemeColorId('rgba(255, 0, 0, 0.5)')).toBe(false);
        expect(isThemeColorId('rgb(0,0,0)')).toBe(false);
        expect(isThemeColorId('hsl(120 50% 50% / .5)')).toBe(false);
        expect(isThemeColorId('transparent')).toBe(false);
    });

    it('does not treat other values as theme color ids.', () => {
        expect(isThemeColorId(undefined)).toBe(false);
        expect(isThemeColorId('')).toBe(false);
        expect(isThemeColorId('.ansiGreen')).toBe(false);
        expect(isThemeColorId('terminal.')).toBe(false);
        expect(isThemeColorId('1.5')).toBe(false);
    });
});
