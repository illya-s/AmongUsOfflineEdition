export const colorFromNumber = (num, alpha = 1) => {
    const hue = (num * 137.508) % 360;
    return `hsl(${hue} 95% 58% / ${alpha})`;
}
