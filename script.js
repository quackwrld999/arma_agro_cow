const canvas = document.getElementById("posterCanvas");
    const ctx = canvas.getContext("2d");

    const brandEl = document.getElementById("brand");
    const cattleNoEl = document.getElementById("cattleNo");
    const weightEl = document.getElementById("weight");
    const categoryOutput = document.getElementById("categoryOutput");
    const cowImageInput = document.getElementById("cowImageInput");

    const photoScaleEl = document.getElementById("photoScale");
    const photoXEl = document.getElementById("photoX");
    const photoYEl = document.getElementById("photoY");

    const cattleXAdjustEl = document.getElementById("cattleXAdjust");
    const cattleYAdjustEl = document.getElementById("cattleYAdjust");
    const weightXAdjustEl = document.getElementById("weightXAdjust");
    const weightYAdjustEl = document.getElementById("weightYAdjust");

    const frameXAdjustEl = document.getElementById("frameXAdjust");
    const frameYAdjustEl = document.getElementById("frameYAdjust");
    const frameWAdjustEl = document.getElementById("frameWAdjust");
    const frameHAdjustEl = document.getElementById("frameHAdjust");

    const generateBtn = document.getElementById("generateBtn");
    const downloadBtn = document.getElementById("downloadBtn");

    const resetPhotoBtn = document.getElementById("resetPhotoBtn");
    const resetBottomTextBtn = document.getElementById("resetBottomTextBtn");
    const resetFrameBtn = document.getElementById("resetFrameBtn");

    let cowImage = null;
    let currentTemplate = null;

    let isDragging = false;
    let lastMouseX = 0;
    let lastMouseY = 0;

    const TEMPLATES = {
      ARMA: {
        SILVER: "arma_silver.jpg",
        GOLD: "arma_gold.jpg",
        PLATINUM: "arma_platinum.jpg"
      },
      AgroLink: {
        SILVER: "agrolink_silver.png",
        GOLD: "agrolink_gold.png",
        PLATINUM: "agrolink_platinum.png"
      }
    };

    const LAYOUTS = {
      ARMA: {
        SILVER: {
          photo: { x: 0.075, y: 0.330, w: 0.850, h: 0.350 },
          infoCattle: { x: 0.245, y: 0.758 },
          infoWeight: { x: 0.500, y: 0.758 }
        },
        GOLD: {
          photo: { x: 0.075, y: 0.330, w: 0.850, h: 0.350 },
          infoCattle: { x: 0.245, y: 0.758 },
          infoWeight: { x: 0.500, y: 0.758 }
        },
        PLATINUM: {
          photo: { x: 0.075, y: 0.330, w: 0.850, h: 0.350 },
          infoCattle: { x: 0.245, y: 0.758 },
          infoWeight: { x: 0.500, y: 0.758 }
        }
      },

      AgroLink: {
        SILVER: {
          photo: { x: 0.075, y: 0.330, w: 0.850, h: 0.350 },
          infoCattle: { x: 0.340, y: 0.735 },
          infoWeight: { x: 0.560, y: 0.735 }
        },
        GOLD: {
          photo: { x: 0.075, y: 0.330, w: 0.850, h: 0.350 },
          infoCattle: { x: 0.340, y: 0.735 },
          infoWeight: { x: 0.560, y: 0.735 }
        },
        PLATINUM: {
          photo: { x: 0.075, y: 0.330, w: 0.850, h: 0.350 },
          infoCattle: { x: 0.340, y: 0.735 },
          infoWeight: { x: 0.560, y: 0.735 }
        }
      }
    };

    function getNumericWeight() {
      const raw = weightEl.value.trim();
      const match = raw.match(/\d+/);
      return match ? Number(match[0]) : 0;
    }

    function formatWeightDisplay() {
      const n = getNumericWeight();
      return n > 0 ? `±${n} KG` : "";
    }

    function getCategory(weight) {
      weight = Number(weight);

      if (weight >= 120 && weight <= 250) return "SILVER";
      if (weight >= 251 && weight <= 370) return "GOLD";
      if (weight >= 371 && weight <= 1000) return "PLATINUM";

      return "OUT OF RANGE";
    }

    function getCategoryColor(category) {
      if (category === "SILVER") return "#f1f1f1";
      if (category === "GOLD") return "#d8a738";
      if (category === "PLATINUM") return "#c7a6ff";
      return "#ffffff";
    }

    function updateCategoryText() {
      const category = getCategory(getNumericWeight());
      categoryOutput.textContent = category;
      return category;
    }

    function loadImage(src) {
      return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("Could not load template: " + src));
        image.src = src;
      });
    }

    function roundedRectanglePath(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }

    function drawImageCover(image, boxX, boxY, boxW, boxH, scaleExtra, offsetX, offsetY) {
      const baseScale = Math.max(boxW / image.width, boxH / image.height);
      const scale = baseScale * scaleExtra;

      const drawW = image.width * scale;
      const drawH = image.height * scale;

      const drawX = boxX + (boxW - drawW) / 2 + offsetX;
      const drawY = boxY + (boxH - drawH) / 2 + offsetY;

      ctx.drawImage(image, drawX, drawY, drawW, drawH);
    }

    function getPhotoBox(brand, category) {
      const layout = LAYOUTS[brand][category].photo;

      return {
        x: layout.x * canvas.width + Number(frameXAdjustEl.value),
        y: layout.y * canvas.height + Number(frameYAdjustEl.value),
        w: layout.w * canvas.width + Number(frameWAdjustEl.value),
        h: layout.h * canvas.height + Number(frameHAdjustEl.value)
      };
    }

    async function drawPoster() {
      const brand = brandEl.value;
      const cattleNo = cattleNoEl.value.trim() || "00";
      const category = updateCategoryText();
      const weightDisplay = formatWeightDisplay();

      if (category === "OUT OF RANGE") {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#111";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.font = "bold 40px Arial";
        ctx.fillText("Weight Out of Range", canvas.width / 2, canvas.height / 2 - 20);

        ctx.font = "24px Arial";
        ctx.fillText("Use weight between 120 and 1000 kg", canvas.width / 2, canvas.height / 2 + 25);
        return;
      }

      const templatePath = TEMPLATES[brand][category];

      try {
        currentTemplate = await loadImage(templatePath);

        canvas.width = currentTemplate.width;
        canvas.height = currentTemplate.height;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(currentTemplate, 0, 0, canvas.width, canvas.height);

        const photoBox = getPhotoBox(brand, category);
        const color = getCategoryColor(category);

        if (cowImage) {
          ctx.save();
          roundedRectanglePath(photoBox.x, photoBox.y, photoBox.w, photoBox.h, 10);
          ctx.clip();

          drawImageCover(
            cowImage,
            photoBox.x,
            photoBox.y,
            photoBox.w,
            photoBox.h,
            Number(photoScaleEl.value),
            Number(photoXEl.value),
            Number(photoYEl.value)
          );

          ctx.restore();

          ctx.save();
          ctx.strokeStyle = color;
          ctx.lineWidth = Math.max(3, canvas.width * 0.0035);
          roundedRectanglePath(photoBox.x, photoBox.y, photoBox.w, photoBox.h, 10);
          ctx.stroke();

          ctx.strokeStyle = "rgba(255,255,255,0.45)";
          ctx.lineWidth = Math.max(1, canvas.width * 0.0015);
          roundedRectanglePath(photoBox.x + 5, photoBox.y + 5, photoBox.w - 10, photoBox.h - 10, 8);
          ctx.stroke();
          ctx.restore();
        }

        const info = LAYOUTS[brand][category];

        const cattleX =
          info.infoCattle.x * canvas.width + Number(cattleXAdjustEl.value);
        const cattleY =
          info.infoCattle.y * canvas.height + Number(cattleYAdjustEl.value);

        const weightX =
          info.infoWeight.x * canvas.width + Number(weightXAdjustEl.value);
        const weightY =
          info.infoWeight.y * canvas.height + Number(weightYAdjustEl.value);

        ctx.save();
        ctx.fillStyle = color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `bold ${Math.round(canvas.width * 0.038)}px Georgia`;

        ctx.fillText(cattleNo, cattleX, cattleY);
        ctx.fillText(weightDisplay, weightX, weightY);

        ctx.restore();

      } catch (error) {
        console.error(error);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#111";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.font = "bold 34px Arial";
        ctx.fillText("Template File Not Found", canvas.width / 2, canvas.height / 2 - 30);

        ctx.font = "22px Arial";
        ctx.fillText(templatePath, canvas.width / 2, canvas.height / 2 + 10);

        ctx.font = "18px Arial";
        ctx.fillText("Make sure the template image is in the same folder as index.html", canvas.width / 2, canvas.height / 2 + 45);
      }
    }

    cowImageInput.addEventListener("change", function (event) {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();

      reader.onload = function (e) {
        const image = new Image();
        image.onload = function () {
          cowImage = image;
          drawPoster();
        };
        image.src = e.target.result;
      };

      reader.readAsDataURL(file);
    });

    function resetPhoto() {
      photoScaleEl.value = 1;
      photoXEl.value = 0;
      photoYEl.value = 0;
      drawPoster();
    }

    function resetBottomText() {
      cattleXAdjustEl.value = 0;
      cattleYAdjustEl.value = 0;
      weightXAdjustEl.value = 0;
      weightYAdjustEl.value = 0;
      drawPoster();
    }

    function resetFrame() {
      frameXAdjustEl.value = 0;
      frameYAdjustEl.value = 0;
      frameWAdjustEl.value = 0;
      frameHAdjustEl.value = 0;
      drawPoster();
    }

    brandEl.addEventListener("change", drawPoster);
    cattleNoEl.addEventListener("input", drawPoster);
    weightEl.addEventListener("input", drawPoster);

    photoScaleEl.addEventListener("input", drawPoster);
    photoXEl.addEventListener("input", drawPoster);
    photoYEl.addEventListener("input", drawPoster);

    cattleXAdjustEl.addEventListener("input", drawPoster);
    cattleYAdjustEl.addEventListener("input", drawPoster);
    weightXAdjustEl.addEventListener("input", drawPoster);
    weightYAdjustEl.addEventListener("input", drawPoster);

    frameXAdjustEl.addEventListener("input", drawPoster);
    frameYAdjustEl.addEventListener("input", drawPoster);
    frameWAdjustEl.addEventListener("input", drawPoster);
    frameHAdjustEl.addEventListener("input", drawPoster);

    generateBtn.addEventListener("click", drawPoster);
    resetPhotoBtn.addEventListener("click", resetPhoto);
    resetBottomTextBtn.addEventListener("click", resetBottomText);
    resetFrameBtn.addEventListener("click", resetFrame);

    downloadBtn.addEventListener("click", async function () {
      await drawPoster();

      const brand = brandEl.value;
      const cattleNo = cattleNoEl.value.trim() || "00";
      const category = getCategory(getNumericWeight());

      const link = document.createElement("a");
      link.download = `${brand}_${category}_Cattle_${cattleNo}.jpg`;

      const jpgCanvas = document.createElement("canvas");
      jpgCanvas.width = canvas.width;
      jpgCanvas.height = canvas.height;

      const jpgCtx = jpgCanvas.getContext("2d");
      jpgCtx.fillStyle = "#000";
      jpgCtx.fillRect(0, 0, jpgCanvas.width, jpgCanvas.height);
      jpgCtx.drawImage(canvas, 0, 0);

      link.href = jpgCanvas.toDataURL("image/jpeg", 0.95);
      link.click();
    });

    canvas.addEventListener("mousedown", function (event) {
      if (!cowImage) return;
      isDragging = true;
      lastMouseX = event.clientX;
      lastMouseY = event.clientY;
    });

    window.addEventListener("mouseup", function () {
      isDragging = false;
    });

    window.addEventListener("mousemove", function (event) {
      if (!isDragging) return;

      const dx = event.clientX - lastMouseX;
      const dy = event.clientY - lastMouseY;

      lastMouseX = event.clientX;
      lastMouseY = event.clientY;

      photoXEl.value = Number(photoXEl.value) + dx;
      photoYEl.value = Number(photoYEl.value) + dy;

      drawPoster();
    });

    canvas.addEventListener("wheel", function (event) {
      if (!cowImage) return;

      event.preventDefault();

      let scale = Number(photoScaleEl.value);

      if (event.deltaY < 0) {
        scale += 0.03;
      } else {
        scale -= 0.03;
      }

      scale = Math.max(0.4, Math.min(2.8, scale));
      photoScaleEl.value = scale.toFixed(2);

      drawPoster();
    }, { passive: false });

    updateCategoryText();
    drawPoster();
