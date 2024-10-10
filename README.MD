# Minh Custom Hooks

Đây là custom hooks được viết bởi hoanggminh2702, bao gồm:

1. **[useToggle](#use-toggle)**
2. **[useDebounce group](#use-debounce-group)**
3. **[useMount](#use-mount)**
4. **[useDidUpdate](#use-did-update)**
5. **[useEventEffect](#use-event-effect)**
6. **[useEventDidUpdate](#use-event-did-update)**
7. **[useEventMemo](#use-event-memo)**

---

<h2 id="use-toggle">1. useToggle</h2>
Đây là hook được viết để rút ngọn quá trình xử lý loading state, hoặc trong các trường hợp quản lý các state chỉ có 2 giá trị <span style="color: blue; font-weight: 600;">true</span> hoặc <span style="color: blue; font-weight: 600;">false</span> <br> <br>

**_Ví dụ_**
Sau đây là ví dụ về xử lý loading trong ReactJs bằng cách truyền thông và bằng useToggle

**Truyền thống**

```tsx
...
// Loading state
const [isLoading, setIsLoading] = useState(false)

// Handle 1 tác vụ bất đồng bộ khi click btn
const handleCallApi = () => {
    setLoadingState(true)
    apiCall().then(res => {
        setLoadingState(false)
        ...
    })
}

return (
    <div>
        <button onClick={handleCallApi}>Call api</button>
    </div>
)
```

Có thể thấy trong trường hợp chỉ sử dụng state để handleLoading, việc đọc code trở không được trực quan, khi hầu hết việc thay đổi trạng thái loading về mặt thị giác đều là setState, gây cản trở trong quá trình đọc hiểu code thay vào đó, ta có thể sử dụng useToggle

```tsx
// Loading state và các handler của nó được defined sẵn
const {state: isLoading, on: startLoading, off: stopLoading} = useToggle(false)

// Handle 1 tác vụ bất đồng bộ khi click btn
const handleCallApi = function() {
    // Khi nhìn vào mặc nhiên sẽ biết được ngay đây là hành động bắt đầu loading
    startLoading()
    apiCall().then(res => {
        // Tương tự với startLoading
        stopLoading()
        ...
    })
}

...

```

---

<h2 id="use-debounce-group">2. useDebounce Group</h2>

- Hook này được viết ra để xử lý các tác vụ cần tới kỹ thuật debounce.

- Vậy kỹ thuật debounce là gì? Kỹ thuật debounce trong ReactJs nói riêng là kỹ thuật trì hoãn việc update state khi thực hiện setState liên tục trong 1 khoảng thời gian ngắn, việc update lại state chỉ được thực hiện sau khi hành động setState dừng lại sau 1 khoảng thời gian được quy ước từ trước. Việc này có thể giảm thiểu số lần re-render của app. Việc sử dụng debounce trong 1 số trường hợp logic code được viết để gọi API mỗi khi state được thay đổi còn giúp giảm gánh nặng cho server, tránh gửi quá nhiều request không cần thiết tới server.
- Sau đây là 1 ví dụ đơn giản về ý nghĩa của việc áp dụng kỹ thuật debounce

**Khi không sử dụng kỹ thuật debounce**

```tsx
...
const [searchText, setSearchText] = useState<string>("")
const [listData, setListData] = useState<TData>([])

// Thực hiện call api tìm kiếm khi searchText thay đổi
useEffect(() => {
    /**
     * callback được gọi liên tục khi searchText thay đổi, dẫn tới
     * api được call liên tục, trong trường hợp mạng ổn định có thể dẫn
     * tới trường hợp request gửi trước nhưng kết quả trả về sau, dẫn
     * tới việc listData được set là kết quả request cũ
    */
    searchApi(searchText).then(res => setListData(res))
}, [searchText])

return (
    <div>
        <input value={searchText} onChange={e =>
            setSearchText(e.target.value)
        } />

        {listData.map(data => ...) }
    </div>
)
```

**Khi sử dụng kỹ thuật debounce**
Ví dụ này sẽ sử dụng hook useDebounceState

```tsx
...
const {
    // Đây là state thực tế chưa áp dụng kỹ thuật debounce
    actualState: searchText,
    debouncedState: debouncedText,
    setState: setSearchText
} = useDebounceState<string>("",
    // Thời gian sau khi hành động setState dừng lại, đơn vị ms
    500
)

// Thực hiện call api tìm kiếm khi searchText thay đổi
useEffect(() => {
    /**
     * callback được gọi chỉ khi debouncedText thay đổi, khi  việc
     * setSearchText dừng lại 500ms
    */
    searchApi(searchText).then(res => setListData(res))
}, [searchText])

...

```

Có 3 debounce hook được expose:

- **[useDebounce](#use-debounce)**
- **[useDebounceState](#use-debounce-state)**
- **[useDebounceFn](#use-debounce-fn)**

<h3 id="use-debounce">useDebounce</h3>

> <span id="use-debounce-input">Input</span>:
>
> 1. defaultState: State mặc định
> 2. debounceTime: Thời gian debounce, mặc định 500ms

> <span id="use-debounce-output">Output</span>:
>
> 1. debouncedState: state đã được debounce, chỉ thay đổi khi hành động > setState được dừng lại sau debounceTime
> 2. stop: dừng việc set lại debouncedState nếu nó chưa được thay đổi
> 3. status: Gồm 2 trạng thái:
>
> - <span style="color: green; font-weight: 500;">DONE</span>: Trạng thái sau khi hoàn thành việc debounce, debouncedValue được thay đổi
> - <span style="color: green; font-weight: 500;">PENDING</span>: Trạng thái khi đang trong quá trình debounce

**_Ví dụ:_**

```tsx
...
const [searchText, setSearchText] = useState("")
const {
    debouncedState: debouncedText,
    status
    // Khi searchText thay đổi, debounce sẽ được chạy, khi thực hiện xong
    // thì debouncedState được update lại
} = useDebounce<string>(searchText,
    500
)

useEffect(() => {
    searchApi(debouncedText).then(res => setListData(res))
}, [debouncedText])

return (
    <div>
        <input value={searchText} onChange={e =>
            setSearchText(e.target.value)
        } />

        {
            /**
             *  Nếu không sử dụng status để xử lý loading, mà chỉ loading khi
             * gửi call API thì sau khi quá trình debounce được thực hiện thì
             * API mới được gọi, bắt đầu quá trình loading, giao diện bị giật,
             * Không thân thiện với người dùng, thay vào đó, ngay khi bắt đầu
             * quá trình debounce, ngay lập tức loading
             *
             * */
            status === DebounceValueStatus.PENDING ? {"Loading"} : listData.map(data => ...)
        }
    </div>
)
...

```

<h3 id="use-debounce-state">useDebounceState</h3>
Là hook được sử dụng như 1 useState, expose state thực tế và state đã được debounce, giảm độ dài code.

> Input:
>
> 1.  defaultState: State mặc định
> 2.  debounceTime: Thời gian debounce, mặc định 500ms
>
> Output:
>
> 1.  debouncedState: như [useDebounce](#use-debounce-output)
> 2.  status: [useDebounce](#use-debounce-output)
> 3.  actualState: tham số thứ 1 khi sử dụng useState
> 4.  setState: tham số thứ 2 khi sử dụng useState

**_Ví dụ_**

```tsx
// Thay vì phải viết dài dòng thế này
const [searchText, setSearchText] = useState('')
const { debouncedState: debouncedText, status } = useDebounce<string>(searchText, 500)

// Ta có thể viết ngắn gọn thế này
const {
  actualState: searchText,
  debouncedState: debouncedText,
  setState: setText,
  status,
} = useDebounceState<string>('', 500)
```

<h3 id="use-debounce-fn">useDebounceFn</h3>

Trong những trường hợp phải debounce 1 tác vụ phức tạp thay vì chỉ thực hiện debounce việc thay đổi state.

> Input:
>
> 1.  callback: callback cần được debounce, callback này có thể là 1 pure function, hoặc trả về 1 promise.
> 2.  config: thêm các tùy chọn config
>
> - debounceTime: tương tự [useDebounce debounceTime](#use-debounce-input),
> - Nếu callback là 1 promise:
>   i. onSuccees: callback khi Promise resolve.
>   ii. onError: callback khi Promise reject.
>
> 3.  deps: trong trường hợp muốn sử dụng useCallback cho callback.
>
> Output:
>
> 1.  returnedData: Data trả về của callback, nếu callback trả về 1 Promise, data này sẽ là kết quả của Promise sau khi thưc thi debounce và Promise resolve kết quả.
> 2.  status: tương tự [useDebounce status](#use-debounce-output).
> 3.  progressStatus: Toàn bộ trạng thái từ khi debounce đến khi Promise resolve hoặc reject. Các trạng thái tương tự [useDebounce status](#use-debounce-output).
> 4.  run: thực thi callback.
> 5.  stop: tương tự [useDebounce stop](#use-debounce-output)

**_Ví dụ_**

```tsx
...
const [fullName, setFullName] = useState<string>("")
const [address, setAddress] = useState<string>("")

const [listData, setListData] = useState([])

const handleSearch = (fullName, address) => {
    searchAPI().then(res => setListData(res))
}

...

```

Trong trường hợp handleSearch không phải là tác vụ bất đồng bộ, ta có thể debounce nó như sau

```tsx
...
const {
    run,
    // Vẫn có thể dùng status để xử lý loading
    status
} = useDebounceFn(handleSearch, {
    debounceTime: 500 //ms
});

useEffect(() => {
    // Gọi và sử dụng như bình thường
    run(fullName, address);
}, [])
```

Khi handleSearch là 1 tác vụ bất đồng bộ, useDebounce cung cấp nhiều cách tiếp cận khác nhau để xử lý debounce và kết quả nhận được

```tsx
...
const handleSearch = async (fullName, address) => {
    return await searchAPI().then(res => setListData(res))
}
```

- Sử dụng useDebounceFn, với returnData:

```tsx
...

const {run, returnedData} = useDebounceFn(handleSearch)

useEffect(() => {
   run(fullName, address);
}, [])

useEffect(() => {
    setListData(returnedData)
}, [returnedData])

...

```

- Sử dụng useDebounceFn, với onSuccess, onError:

```tsx
...

// Kết hợp với useToggle để xử lý loading
const {state: isLoading, on: startLoading, off: stopLoading } = useToggle(false)

// Chỉ khi callback truyền vào là tác vụ bất đồng bộ thì mới có thể sử dụng onSuccess, onError
const {run, returnedData} = useDebounceFn(handleSearch, {
    onSuccess(res) {
        stopLoading();
        setListData(res);
    }
})

useEffect(() => {
    startLoading();
    run(fullName, address);
}, [])

useEffect(() => {
    setListData(returnedData)
}, [returnedData])

...

```

---

<h2 id="use-mount">3. useMount</h2>

Sử dụng để thay thế useEffect với deps rỗng

```tsx
useEffect(() => {}, [])
// Tương đương với
useMount(() => {})
```

Ngoài ra, useMount sẽ không bị ảnh hưởng StrictMode, tức là nó chỉ được gọi 1 lần duy nhất khi component được mount, đảm bảo hành vi của app sát với production nhất

---

<h2 id="use-did-update">4. useDidUpdate</h2>

Khi useEffect được truyền deps, nó sẽ gọi ngay cả khi vừa được mount cũng như khi deps thay đổi, hook này giúp cho callback chỉ được gọi khi deps thay đổi chứ không gọi khi component vừa được mount. Syntax tương tự như useEffect.

---

<h2 id="use-event-effect">5. useEventEffect</h2>

Hook này handle việc callback truyền vào useEffect chỉ được gọi khi deps thay đổi, nhưng vẫn sử dụng được state mới nhất

**_Ví dụ_**

```tsx
const [count, setCount] = useState<number>(0)
const [text, setText] = useState<string>('')

useEffect(() => {
  console.log('count', count)
  console.log('text', text)
}, [count, text])

return (
  <div>
    <button onClick={() => setCount((prev) => prev + 1)}>Increase</button>
    <input onChange={(e) => setText(e.target.value)} />
  </div>
)
```

Trường hợp này, cho dù ta có thay đổi text bao nhiêu thì khi count thay đổi, kết quả in ra vẫn là:

- "count", count là kết quả hiện tại của count
- "text", "" là kết quả ban đầu của text

Nếu ta cố tình thêm text vào list deps, thì khi text thay đổi, callback của effect cũng sẽ được gọi, không đúng với mong muốn ban đầu. Và useEventEffect sẽ giải quyết được vấn đề đó. Syntax tương tự nhiên useEffect.

```tsx
...
useEventEffect(() => {
    // Chỉ khi count thay đổi thì callback mới được gọi, nhưng text luôn được update giá trị mới nhất
    console.log(count, text)
}, [count, text])
```

---

<h2 id="use-event-did-update">6. useEventDidUpdate</h2>

Là sự kết hợp của [useDidUpdate](#use-did-update) và [useEventEffect](#use-event-effect)

<h2 id="use-event-memo">7. useEventMemo</h2>

Đối với [useEventEffect](#use-event-effect), callback được gọi khi deps thay đổi, các state trong deps vẫn được update mới nhất, tương tự với useEventMemo, việc tính toán lại giá trị mới chỉ được thực hiện khi deps thay đổi, tuy nhiên các state khác không nằm trong deps vẫn được cập nhật giá trị mới nhất
