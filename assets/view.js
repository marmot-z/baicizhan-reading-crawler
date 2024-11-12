class CircleQueue {
    _speedOrder = ['new_slow', 'slow', 'normal', 'fast', 'new_fast'];

    constructor(obj, onNext) {
        this._queue = Object.entries(obj)
            .sort(([k1, v1], [k2, v2]) => {
                return this._speedOrder.indexOf(k1) - this._speedOrder.indexOf(k2);
            })
            .map(([k, v]) => v);
        this.onNext = onNext;
        this.currentIndex = 4;
    }

    next() {
        ++this.currentIndex;
        this.onNext && this.onNext(this.get());

        return this.get();
    }

    get() {
        return this._queue[this.currentIndex % this._queue.length];
    }
}

const q = new CircleQueue(audioInfo.audio_info_by_speed);

window.onload = () => {
    $('audio').initAudioPlayer({onTimeUpdate: syncAudioTextProcess});

    if (currentChapter > 1) {
        document.querySelector('#previousChapterButton').onclick = () => window.location.href = `../chapter-${currentChapter-1}/index.html`;
    }

    if (currentChapter < totalChapter) {
        document.querySelector('#nextChapterButton').onclick = () => window.location.href = `../chapter-${currentChapter+1}/index.html`;
    }

    document.addEventListener('keydown', (e) => {
        let $pausePlayBtn = $('div.ppq-audio-player > div.play-pause-btn');
        let audio = document.querySelector('div.ppq-audio-player > audio');

        if (e.code === 'Space') {
            e.preventDefault();
            $pausePlayBtn.click();
        } else if (e.code === 'ArrowRight') {
            e.preventDefault();
            let buffered = audio.buffered;
            audio.currentTime = Math.min(buffered.end(buffered.length - 1), audio.currentTime + 5);
        } else if (e.code === 'ArrowLeft') {
            e.preventDefault();
            audio.currentTime = Math.max(0, audio.currentTime - 5);
        }
    });
};

function syncAudioTextProcess(currentTime) {
    const index = binarySearch(q.get().time_list, currentTime);

    $('.text-left.p-active').removeClass('p-active');
    $(`.text-left:nth-child(${index})`).addClass('p-active');
}

function binarySearch(arr, val) {
    let start = 0;
    let end = arr.length - 1;
  
    while (start <= end) {
      let mid = Math.floor((start + end) / 2);
  
      if (arr[mid] === val) {
        return mid;
      }
  
      if (val < arr[mid]) {
        end = mid - 1;
      } else {
        start = mid + 1;
      }
    }
    return start;
  }