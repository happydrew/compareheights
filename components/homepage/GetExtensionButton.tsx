import { ChromeIcon, EdgeBrowserIcon } from '@components/icons'

const GetExtensionButton = () => {
    return (
        <div className="leading-[1.6] [font-feature-settings:initial] [font-size:min(1.3rem,max(3.5vw,1.2rem))]">
            <a className='flex items-center justify-center flex-nowrap whitespace-nowrap mt-2 px-6 py-3 rounded-full text-white bg-gradient-to-b from-[#d97706] to-[#92400e] [text-shadow:0_1px_1px_#00387838] [box-shadow:0_1px_2px_#00295738] transition-all duration-200 ease-in-out select-none [user-drag:none] [-webkit-tap-highlight-color:transparent]'
                href="https://chromewebstore.google.com/detail/autocommentai/lnnbcbhcffnggkibgmhhjjgadjiainhd"
                target="_blank">
                Add to Chrome/Edge
                <ChromeIcon className="inline-block ml-2 w-8 h-8" />
                <EdgeBrowserIcon className="inline-block ml-2 w-8 h-8" />
            </a>

        </div>
    )
}

export default GetExtensionButton