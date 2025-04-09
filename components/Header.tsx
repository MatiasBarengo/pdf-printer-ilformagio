import Image from "next/image"

export default function Header() {
    return (
        <div className="print-header relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-r from-orange-50 via-red-100 to-orange-50"></div>

            {/* Content Container */}
            <div className="relative px-6 py-8">
                {/* Top Decorative Border */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 via-red-500 to-blue-600"></div>

                {/* Main Content - Flex Row */}
                <div className="flex flex-row items-center justify-between">
                    <Image
                        src={'/cremigal-logo.png'}
                        width={90}
                        height={50}
                        alt="punta del agua"
                    />
                    {/* Center - Logo and Title */}
                    <div className="flex flex-col items-center">
                        <div className="relative w-36 h-36">
                            <Image
                                src="/logolyr.png"
                                alt="LYR Distribuidora Logo"
                                width={144}
                                height={144}
                            />
                        </div>
                    </div>
                    <Image
                        src={'/puntadelagua.png'}
                        width={50}
                        height={50}
                        alt="punta del agua"
                    />
                </div>

                {/* Bottom Decorative Border */}
                <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 via-red-500 to-blue-600"></div>
            </div>
        </div>
    )
}

