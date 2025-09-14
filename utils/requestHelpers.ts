export const getIdFromRequest = (request: Request, segmentName: string): string | null => {
    const segments = new URL(request.url).pathname.split("/");
    const index = segments.findIndex(s => s === segmentName);
    if (index === -1 || index + 1 >= segments.length) return null;
    return segments[index + 1];
};