// npm install pdfjs-dist --save-dev
//
//
//@mui
import { Button, LinearProgress } from "@mui/material";
//---------------------------------------------------------------------
import { Routes, Route, useNavigate } from "react-router";
import NoteFound from "@/pages/404";
import { ResponsiveLayout } from "@/layouts/default_layout";
import * as pdfjsLib from "pdfjs-dist";
import { useEffect, useState, useRef, createRef } from "react";

///cdn worker
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.mjs";
// my class
class PDF_JS_DIST {
  constructor() {
    this.lip = pdfjsLib;
    this.pdf = null;
    this.page = new Map();

    // fix error render canvas
    this.pageRendering = false;
  }

  clearPage() {
    this.page.clear();
  }

  async loadPdf(url) {
    if (!this.lip) return;
    try {
      this.pdf = await this.lip.getDocument(url).promise;
    } catch (error) {
      console.error("=> error obj load pdf : " + error);
    }
  }

  async loadPage(number) {
    const page = number || 1;
    try {
      const resultLoadPage = await this.pdf.getPage(page);
      this.page.set(page, resultLoadPage);
    } catch (error) {
      console.error("=> error obj load page : " + error);
    }
  }

  async renderPage(canvasRef, pageNumber, scale, rotation) {
    try {
      if (this.pageRendering) {
        console.log("page is busy rendering page: " + pageNumber);
        return;
      } else {
        this.pageRendering = true;
        const _canvas = canvasRef.current;
        const _page = pageNumber || 1;
        const _scale = scale || 1;
        const _rotation = rotation || 0;
        const viewport = await this.page
          ?.get(_page)
          ?.getViewport({ scale: _scale, rotation: _rotation });
        const context = _canvas?.getContext("2d");
        context.clearRect(0, 0, _canvas?.width, _canvas?.height); // Clear the entire canvas

        if (!(_canvas instanceof HTMLCanvasElement)) {
          console.error(
            "Stored object is NOT a valid <canvas> element!",
            _canvas,
          );
        }
        _canvas.height = viewport.height || 1;
        _canvas.width = viewport.width || 1;
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        const renderTask = this.page.get(_page).render(renderContext);
        await renderTask.promise;
        console.log("finish render page" + _page);
        this.pageRendering = false;
      }
    } catch (error) {
      console.log(error);
    }
  }

  get totalPage() {
    return this.pdf._pdfInfo.numPages;
  }
}

//WARNING :

/// global this for fix render canvas error
//-------------------------------------------------------------------------------
const PDF = new PDF_JS_DIST();

function PdfView({ url }) {
  const [pageLoaded, setPageLoaded] = useState(false);
  const canvasMap = useRef(new Map());

  console.log(canvasMap.current.get(1));

  const ref1 = useRef();
  const ref2 = useRef();
  // iritail load pdf from url
  useEffect(() => {
    loadPdf(url, 1);
  }, [url]);

  async function loadPdf(url) {
    console.log("loading url from > " + url);
    setPageLoaded(false);
    await PDF.loadPdf(url);
    // addCanvas(pageNumber);

    await renderPage(ref1, 1);
    await renderPage(ref2, 2);
  }

  async function renderPage(canvas, pageNumber, scale, rotation) {
    await PDF.loadPage(pageNumber);
    await PDF.renderPage(canvas, pageNumber, scale, rotation);
    setPageLoaded(true);
  }

  //  addCanvas '
  function addCanvas(pageNumber) {
    canvasMap.current.set(pageNumber, createRef());
  }
  // Function to render canvases

  function clearCanvasAll() {
    PDF.clearPage();
  }

  // function clearCanvas(pageNumber) {
  //   if (pageNumber < 0) return;
  //   canvas.current.delete(pageNumber);
  //   setCanvasElement((newArr) =>
  //     newArr.filter((_, index) => index !== pageNumber - 1),
  //   );
  // }

  return (
    <div className="w-[100%] h-[100%]  flex flex-col items-center  overflow-hidden ">
      <ResponsiveLayout>
        <Button>add canvas</Button>
        <Button onClick={() => clearCanvasAll()}>clear canvas</Button>
        <Dashboard isPageLoaded={pageLoaded} />
        <div className=" gap-2  h-[93%] w-[100%] z-0 flex flex-col  no-scrollbar shadow-md items-center    scroll-smooth  overflow-auto ">
          <canvas ref={ref1} className="w-[99%] self-center z-0 shadow-md" />
          <canvas ref={ref2} className="w-[99%] self-center z-0 shadow-md" />
        </div>
      </ResponsiveLayout>
    </div>
  );
}

const Dashboard = ({ isPageLoaded, setUrl }) => {
  const navigate = useNavigate();
  return (
    <div className="w-[100%]   bg-zinc-100 z-10  h-15 shadow-lg ">
      <div className="w-full h-full">
        <Button onClick={() => navigate("/")}>Back</Button>
        <Button onClick={() => console.log(PDF.pdf)}>PDF info</Button>
        <Button onClick={() => console.log(PDF.page.get(1))}>Page info</Button>
        <Button
          onClick={() =>
            setUrl("/Learning the bash Shell, 3rd Edition (3).pdf")
          }
        >
          Download
        </Button>
        <Button onClick={() => navigate("/pdfview/list")}>list page</Button>
      </div>
      <div className="w-full">
        <LinearProgress
          variant="indeterminate"
          sx={{
            display: isPageLoaded ? "none" : "block",
          }}
        />
      </div>
      <hr className="opacity-5" />
    </div>
  );
};

const ListPdf = ({ setUrl }) => {
  const navigate = useNavigate();
  const getPdf = (url) => {
    setUrl(url);
    navigate("/pdfview");
  };
  const url1 = "/Eloquent_JavaScript.pdf";
  const url2 = "/Learning the bash Shell, 3rd Edition (3).pdf";

  return (
    <div className="w-full h-full flex flex-col items-center">
      <div></div>
      <div className="flex justify-center">
        <Button onClick={() => getPdf(url1)}>jsvascript book</Button>
        <Button onClick={() => getPdf(url2)}>bash book</Button>
      </div>
    </div>
  );
};

export default function PdfPage() {
  const [url, setUrl] = useState("/Eloquent_JavaScript.pdf");
  const [page, setPage] = useState(1);
  return (
    <>
      <Routes>
        <Route
          path="*"
          element={<NoteFound docName="PDF pageview !!" />}
        ></Route>
        <Route path="list" element={<ListPdf setUrl={setUrl} />}></Route>
        <Route index element={<PdfView url={url} />}></Route>
      </Routes>
    </>
  );
}
