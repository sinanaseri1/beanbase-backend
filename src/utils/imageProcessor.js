import sharp from 'sharp';

export const processImage = async (buffer) => {
  try {
    const processed = await sharp(buffer)
      .resize(800, 800, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({
        quality: 80,
        progressive: true
      })
      .toBuffer();

    return processed;
  } catch (error) {
    throw new Error('Error processing image: ' + error.message);
  }
};