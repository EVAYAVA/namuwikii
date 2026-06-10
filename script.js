function saveHTML() {

    const htmlContent =
        document.documentElement.outerHTML;

    const blob =
        new Blob(
            [htmlContent],
            { type: "text/html" }
        );

    const a =
        document.createElement("a");

    a.href =
        URL.createObjectURL(blob);

    a.download =
        "profile.html";

    a.click();

    URL.revokeObjectURL(a.href);
}


function saveScreenshot() {

    const target =
        document.getElementById(
            "captureArea"
        );

    html2canvas(target, {
        scale: 2
    }).then(canvas => {

        const link =
            document.createElement("a");

        link.download =
            "profile-screenshot.png";

        link.href =
            canvas.toDataURL();

        link.click();
    });
}
