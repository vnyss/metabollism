// Black & gold "old money" design system — mirrors the web CSS custom properties

export const colors = {
  bg:           '#080808',
  surface:      '#0F0F0F',
  elevated:     '#161616',
  border:       'rgba(201, 168, 76, 0.18)',
  borderHover:  'rgba(201, 168, 76, 0.42)',
  borderInput:  'rgba(201, 168, 76, 0.22)',
  gold:         '#C9A84C',
  goldHover:    '#DFC070',
  text:         '#E8DCC8',
  text2:        '#8A7A62',
  text3:        '#50422E',
  error:        '#d94f4f',
  success:      '#4CAF7A',
};

export const fonts = {
  mono:    'CourierPrime_400Regular',
  monoBold:'CourierPrime_700Bold',
  display: 'SpecialElite_400Regular',
};

export const spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  40,
  xxl: 64,
};

export const radius = {
  none: 0,
  sm:   6,
  md:   12,
  lg:   20,
};

// Common shared styles
export const common = {
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  label: {
    color: colors.text2,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  goldBar: {
    width: 36,
    height: 2,
    backgroundColor: colors.gold,
    marginBottom: spacing.md,
    borderRadius: 2,
  },
  input: {
    backgroundColor: 'rgba(22,22,22,0.8)',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderInput,
    color: colors.text,
    fontSize: 14,
    paddingVertical: 10,
    paddingHorizontal: 2,
    letterSpacing: 0.5,
  },
  inputFocused: {
    borderBottomColor: colors.gold,
  },
  button: {
    backgroundColor: colors.gold,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderRadius: 10,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  buttonText: {
    color: '#080808',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  buttonSecondary: {
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.3)',
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderRadius: 10,
  },
  buttonSecondaryText: {
    color: colors.text2,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
};
