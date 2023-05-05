import { useRef, useEffect, useState } from "react";
import "./App.css";

const url = `http://localhost:9002/mongo-api/d949281e5714b880c5ff32881f43ca3f.wav`;

function fancyTimeFormat(duration) {
  // Hours, minutes and seconds
  const hrs = ~~(duration / 3600);
  const mins = ~~((duration % 3600) / 60);
  const secs = ~~duration % 60;
  // Output like "1:01" or "4:03:59" or "123:03:59"
  let ret = "";

  if (hrs > 0) {
    ret += "" + hrs + ":" + (mins < 10 ? "0" : "");
  }

  ret += "" + mins + ":" + (secs < 10 ? "0" : "");
  ret += "" + secs;

  return ret;
}

function App() {
  window.AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioContext = new AudioContext();

  /**
   * Retrieves audio from an external source, the initializes the drawing function
   * @param {String} url the url of the audio we'd like to fetch
   */
  const drawAudio = (url) => {
    fetch(url)
      .then((response) => response.arrayBuffer())
      .then((arrayBuffer) => audioContext.decodeAudioData(arrayBuffer))
      .then((audioBuffer) => draw(normalizeData(filterData(audioBuffer))));
  };

  /**
   * Filters the AudioBuffer retrieved from an external source
   * @param {AudioBuffer} audioBuffer the AudioBuffer from drawAudio()
   * @returns {Array} an array of floating point numbers
   */
  const filterData = (audioBuffer) => {
    const rawData = audioBuffer.getChannelData(0); // We only need to work with one channel of data
    const samples = 120; // Number of samples we want to have in our final data set
    const blockSize = Math.floor(rawData.length / samples); // the number of samples in each subdivision
    const filteredData = [];
    for (let i = 0; i < samples; i++) {
      let blockStart = blockSize * i; // the location of the first sample in the block
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum = sum + Math.abs(rawData[blockStart + j]); // find the sum of all the samples in the block
      }
      filteredData.push(sum / blockSize); // divide the sum by the block size to get the average
    }
    return filteredData;
  };

  /**
   * Normalizes the audio data to make a cleaner illustration
   * @param {Array} filteredData the data from filterData()
   * @returns {Array} an normalized array of floating point numbers
   */
  const normalizeData = (filteredData) => {
    const multiplier = Math.pow(Math.max(...filteredData), -1);
    return filteredData.map((n) => n * multiplier);
  };

  /**
   * Draws the audio file into a canvas element.
   * @param {Array} normalizedData The filtered array returned from filterData()
   * @returns {Array} a normalized array of data
   */
  const draw = (normalizedData) => {
    // set up the canvas
    const canvas = document.querySelector("canvas");
    const dpr = window.devicePixelRatio || 1;
    const padding = 20;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = (canvas.offsetHeight + padding * 2) * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.translate(0, canvas.offsetHeight / 2 + padding); // set Y = 0 to be in the middle of the canvas

    // draw the line segments
    const width = canvas.offsetWidth / normalizedData.length;
    for (let i = 0; i < normalizedData.length; i++) {
      const x = width * i;
      let height = normalizedData[i] * canvas.offsetHeight - padding;
      if (height < 0) {
        height = 0;
      } else if (height > canvas.offsetHeight / 2) {
        height = height > canvas.offsetHeight / 2;
      }
      drawLineSegment(ctx, x, height, width, (i + 1) % 2);
    }
  };

  /**
   * A utility function for drawing our line segments
   * @param {AudioContext} ctx the audio context
   * @param {number} x  the x coordinate of the beginning of the line segment
   * @param {number} height the desired height of the line segment
   * @param {number} width the desired width of the line segment
   * @param {boolean} isEven whether or not the segmented is even-numbered
   */
  const drawLineSegment = (ctx, x, height, width, isEven) => {
    ctx.lineWidth = 1; // how thick the line is
    ctx.strokeStyle = "#000000"; // what color our line is
    ctx.beginPath();
    height = isEven ? height : -height;
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.arc(x + width / 2, height, width / 2, Math.PI, 0, isEven);
    ctx.lineTo(x + width, 0);
    ctx.stroke();
  };

  const player = useRef(null);
  const [timePlayed, setTimePlayed] = useState(0);
  useEffect(() => {
    player.current = document.querySelector("#audio-player");
    drawAudio(url);
  }, []);
  // player.current = document.querySelector("#audio-player")

  const playerStyle = {
    display: "flex",
    width: "500px",
    height: "100px",
    backgroundColor: "beige",
  };

  return (
    <>
      <div>
        <audio
          id="audio-player"
          style={{ display: "none" }}
          ref={player}
          controls
          src={url}
          onTimeUpdate={(evt) => {
            setTimePlayed(player.current.currentTime);
            console.log(evt);
          }}
        />

        <div style={playerStyle}>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              padding: "0.4em",
            }}
          >
            <canvas
              style={{
                width: "200px",
                height: "75px",
                margin: ".72rem",
              }}
            ></canvas>
            {player.current && (
              <a>
                {fancyTimeFormat(timePlayed)}
                {" / "}
                {fancyTimeFormat(player.current.duration)}
              </a>
            )}
          </span>
          <div>
          </div>
          <button style={{
            marginLeft: 'auto'
          }} onClick={() => player.current.play()}>▶</button>
          <button onClick={() => player.current.pause()}>⏸</button>
        </div>
      </div>
      <p className="read-the-docs">
        React-Music-Player🧡
      </p>
    </>
  );
}

export default App;
