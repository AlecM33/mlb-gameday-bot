const { createCanvas, Image } = require('canvas');
module.exports = {
    drawSimpleTables: (tables, canvasWidth, canvasHeight) => {
        const width = canvasWidth;
        const height = canvasHeight;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#151820';
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = 'white';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';

        let concat = '';

        tables.forEach((table) => {
            concat += table.toString() + '\n\n';
        });

        ctx.fillText(concat, width / 2, 30);

        const croppedCanvas = cropCanvas(canvas);

        return croppedCanvas.toBuffer('image/png');
    },

    drawSavantTables: (statCollections, collectionLabels, spot) => {
        const width = 500;
        const height = 1000;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        const buffer = Buffer.from(spot);

        const img = new Image();

        img.src = buffer;

        ctx.fillStyle = '#151820';
        ctx.fillRect(0, 0, width, height);

        let y = 20;
        ctx.drawImage(img, 148, y);
        y += 150;
        for (let i = 0; i < statCollections.length; i ++) {
            if (!statCollections[i]) continue;

            // Collection Label
            ctx.textAlign = 'center';
            ctx.font = 'bold 20px sans-serif';
            ctx.fillStyle = '#fff';
            ctx.fillText(collectionLabels[i], 208, y);
            y += 30;
            for (let j = 0; j < statCollections[i].length; j ++) {
                if (statCollections[i][j].value === null || statCollections[i][j].value === undefined) {
                    continue;
                }
                const barWidth = statCollections[i][j].percentile * 1.5;
                const circleRadius = 13;
                const circleX = 280 + barWidth;
                const circleY = y - 6;

                // Label
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 16px sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText(statCollections[i][j].label, 20, y);

                ctx.fillStyle = '#fff';
                ctx.textAlign = 'right';
                ctx.fillText(statCollections[i][j].value, 260, y);

                // Backing bar
                ctx.fillStyle = '#32343a';
                ctx.fillRect(280, y - 14, 150, 16);
                // Bar (Solid Color or Striped)
                ctx.fillStyle = statCollections[i][j].isQualified
                    ? statCollections[i][j].sliderColor.hex()
                    : createStripePattern(ctx, statCollections[i][j].sliderColor);
                ctx.fillRect(280, y - 14, barWidth, 16);

                if (statCollections[i][j].isQualified) {
                    ctx.beginPath();
                    ctx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2);
                    ctx.fillStyle = statCollections[i][j].circleColor.hex();
                    ctx.fill();
                    ctx.closePath();

                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 12px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(statCollections[i][j].percentile, circleX, circleY + 4);
                }

                y += 30;
            }
        }

        const croppedCanvas = cropCanvas(canvas, 20);

        return croppedCanvas.toBuffer('image/png');
    }
};

function createStripePattern (ctx, sliderColor) {
    const stripeCanvas = createCanvas(8, 8);
    const stripeCtx = stripeCanvas.getContext('2d');

    // Background color
    stripeCtx.fillStyle = sliderColor.alpha(0.5).hex();
    stripeCtx.fillRect(0, 0, 8, 8);

    stripeCtx.strokeStyle = sliderColor.hex();
    stripeCtx.lineWidth = 1;

    stripeCtx.beginPath();
    stripeCtx.moveTo(0, 8);
    stripeCtx.lineTo(8, 0);
    stripeCtx.stroke();

    return ctx.createPattern(stripeCanvas, 'repeat');
}

function getBoundingBox (ctx, width, height) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const padding = 20;

    let minX = width; let minY = height; let maxX = 0; let maxY = 0;
    let found = false;

    for (let y = 0; y < height; y ++) {
        for (let x = 0; x < width; x ++) {
            const index = (y * width + x) * 4;
            const r = data[index];
            const g = data[index + 1];
            const b = data[index + 2];
            if (r !== 21 && g !== 24 && b !== 32) {
                found = true;
                if (x < minX) minX = x;
                if (y < minY) minY = y;
                if (x > maxX) maxX = x;
                if (y > maxY) maxY = y;
            }
        }
    }

    if (!found) return null;

    minX = minX - padding;
    minY = minY - padding;
    maxX = maxX + padding;
    maxY = maxY + padding;

    return { minX, minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

function cropCanvas (canvas, padding) {
    const ctx = canvas.getContext('2d');
    const boundingBox = getBoundingBox(ctx, canvas.width, canvas.height);
    if (!boundingBox) return null; // No content detected

    const { minX, minY, width, height } = boundingBox;
    const croppedCanvas = createCanvas(width, height);
    const croppedCtx = croppedCanvas.getContext('2d');

    croppedCtx.drawImage(canvas, minX, minY, width, height, 0, 0, width, height);
    return croppedCanvas;
}
